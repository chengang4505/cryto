import Adapter from './adapter.js'
import { precision ,getPrecision} from '../lib/utils.js'
import { Code } from '../lib/const.js'


// grid item
// { ref,price}

// order
// { id, status,price,num,order,type}

export default class Trader{
    // static Staus = Staus;
    constructor(option = {}){
        let {
            openPercentOffset = 1,
            closePercentOffset = 1,
            minClosePercent = 0.8,
            openThreshold = 1000000,
            openMAConfig = null,
            openOffset = 0,
            openMaxN = 3,
            closeMaxN = 5,
            unitValue= 8,
            highPrice= 200,
            lowPrice= 120,
            winPrice= -1,
            losePrice= -1,
            positionPrice= 10000000,
            symbol = 'FIL',
            direction = Code.BUY,
            lever_rate = 5,
        } = option
       
        this.option = option;
        this.direction = direction;
        this.symbol = symbol;
        this.orders = [];
        this.adapter = new Adapter(this.symbol,this.option.keyConfig,this.direction,lever_rate);

        this.openPercentOffset = openPercentOffset;
        this.closePercentOffset = closePercentOffset;
        this.minClosePercent = minClosePercent;

        // ma
        this.openMAConfig = openMAConfig;
        // 开仓阀值
        this.openThreshold = openThreshold;
        this.openMaxN = openMaxN;
        this.openOffset = openOffset;

        this.closeMaxN = closeMaxN;
        // this.maxPrice = Infinity;
        // this.minPrice = -Infinity;

        // this.unit = 0.2;
        // 多少张
        this.unitValue = unitValue;
        // 持仓
        this.availablePosition = 0;
        this.basePosition = 0;
        // 持仓均价
        this.positionPrice = positionPrice;

        this.highPrice = highPrice;
        this.lowPrice = lowPrice;
        this.pricePrecision = getPrecision(this.highPrice);
        // 止盈
        this.winPrice = winPrice;
        // 止损
        this.losePrice = losePrice;
        this.completeOrders = [];

        this.openRange = { max:Infinity,min:-Infinity };
        this.closeRange = { max:Infinity,min:-Infinity };

        this.openList = this.initListPercent(this.lowPrice,this.highPrice,this.openPercentOffset);
        this.closeList = this.initListPercent(this.lowPrice,this.highPrice,this.closePercentOffset);
    }

    getInfo(){
        return {
            
        }
    }

    async init(cb){
        if(this.initFlag) return;
        await this.adapter.init(cb);
        this.initFlag = true;
    }

    initList(low = 30000,high = 62000,offset = 1,align = 50000){

        let list = [];
        let offsetValue = align * offset * 0.01;
        let price;
        for(price = align;price >= low ; price -= offsetValue ){
            list.unshift({price:price,ref:null})
        }

        for(price = align + offsetValue;price <= high ; price += offsetValue ){
            list.push({price:price,ref:null})
        }

        return list;
    }
    initListPercent(low = 30000,high = 62000,offset = 1){

        let list = [];
        let price,offsetValue;

        for(price = low;price <= high ;  ){
            list.push({price:price,ref:null});
            offsetValue = price * offset * 0.01;
            price += offsetValue;
            price = precision(price,this.pricePrecision);
        }

        return list;
    }
    async updateOrderStatus(){
        let orders = this.orders.filter(e => (e.status !== Code.COMPLETE))
        let ids = orders.map(e => e.id);
        if(ids.length === 0) return;

        let infos = await this.adapter.getOrderInfo(ids);
        let statusMap = {};
        infos.forEach(e => ( statusMap[e.id] = e.status ));

        orders.forEach((order) => {
            if(statusMap[order.id] && statusMap[order.id] === Code.COMPLETE) order.status = Code.COMPLETE;
            else order.status = Code.PROCESS;
        })
    }

    async updateListInfo(price){
        let direction = this.adapter.direction;
        let orderMap = {};
        this.orders.forEach(e =>{ orderMap[e.id] = e; });

        let removeOrderMap = {};
        let cancelOrders = [];

        // this.maxPrice = Infinity;
        // this.closeRange = { max:Infinity,min:-Infinity };
        let temp = this.closeList.filter(e => {
            return direction === Code.BUY ? e.price > price : e.price < price
        });

        if(direction === Code.SELL) temp.reverse();

        if(temp.length === 0){
            this.closeRange = { max:-1,min:-1 };
        }else{
            temp = temp.slice(0,this.closeMaxN);
            let v1 = temp[0].price;
            let v2 = temp[temp.length-1].price;
            this.closeRange = { max:Math.max(v1,v2),min:Math.min(v1,v2) };
        }

        this.closeList.forEach(e => {
            if(!e.ref) return;

            // let offsetPercent = this.getPercent(price,e.price);
            let order = orderMap[e.ref];
            if(order.status === Code.COMPLETE){
                removeOrderMap[order.id] = true;
                if(order.order){
                    removeOrderMap[order.order.id] = true;
                }
                this.completeOrders.push({open:order.order ? order.order.price : null,close:order.price,num:order.num});
                this.clearItem(e);
            }
            else if(e.price > this.closeRange.max || e.price < this.closeRange.min){
                cancelOrders.push(order);
                removeOrderMap[order.id] = true;
                this.clearItem(e);
            }

        })


        // this.minPrice = -Infinity;
        temp =  this.openList.filter(e => {
            // e.price < price
            return direction === Code.BUY ? e.price < price : e.price > price
        });

        if(direction === Code.BUY) temp.reverse();

        if(temp.length === 0){
            this.openRange = { max:-1,min:-1 };
        }else{
            temp = temp.slice(0,this.openMaxN);
            let v1 = temp[0].price;
            let v2 = temp[temp.length-1].price;
            this.openRange = { max:Math.max(v1,v2),min:Math.min(v1,v2) };
        }

        // Log('price',this.minPrice)


        this.openList.forEach(e => {
            if(!e.ref) return;

            let order = orderMap[e.ref];
            // let offsetPercent = this.getPercent(price,e.price);
            if(!order || removeOrderMap[e.ref]){
                this.clearItem(e);
            }
            else if( order.status !== Code.COMPLETE && 
                (
                    e.price < this.openRange.min 
                    || e.price > this.openRange.max 
                    || (direction === Code.BUY && e.price > this.openThreshold)
                    || (direction === Code.SELL && e.price < this.openThreshold)
                ))
            {
                cancelOrders.push(order);
                removeOrderMap[order.id] = true;
                this.clearItem(e);
            }
        })

        this.orders = this.orders.filter(e => !removeOrderMap[e.id]);

        // Log('cancelOrders',cancelOrders.length)
        // console.log('cancelOrders',cancelOrders.length)
        // console.log('closeRange',this.closeRange)
        // console.log('openRange',this.openRange)
        if(cancelOrders.length > 0){
            let ids = cancelOrders.map(e => e.id);
            await this.adapter.cancelOrder(ids);
        }
    }

    getPercent(base,v){
        return Math.abs(v-base)/Math.abs(base) * 100;
    }

    getCharge(price,num,percent){
        return price * num * percent * 0.01;
    }

    async completeList(price,account,available){
        let balance = account.margin_available * account.lever_rate;
        let direction = this.adapter.direction;

        console.log(
            'margin_available',precision(account.margin_available,1),
            '张',Math.floor(balance/price/this.adapter.contract_size),
            'available position',this.availablePosition)

        let minCharge = this.unitValue * this.adapter.contract_size * price * 0.0025;

        if(
            balance > minCharge 
            && 
            ((direction === Code.BUY && price <= this.openThreshold) || (direction === Code.SELL && price >= this.openThreshold))
        ){

            // let num = this.openMaxN - openN;
            let mas = null;
            let ma = null;
            if(this.openMAConfig && this.openMAConfig.period && this.openMAConfig.type){
                // console.log('openMAConfig',this.openMAConfig)
                mas = await this.adapter.getMa(this.openMAConfig.type,this.openMAConfig.period); 
                if(this.direction === Code.BUY){
                    ma = Math.min(...mas);
                }else{
                    ma = Math.max(...mas);
                }
                console.log('mas',mas.map(e => e.toFixed(4)).join(','),'ma',ma);
            }

            let tempOrders = this.openList.filter(e => (e.price>= this.openRange.min && e.price<=this.openRange.max));
            if(direction === Code.BUY) tempOrders.reverse();

            // Log(ma)
            for (let index = 0 ; index < tempOrders.length ; index++) {
                let e = tempOrders[index];

                if(balance < minCharge + this.unitValue  * this.adapter.contract_size * e.price) break;

                if(e.ref) continue;
                // if(e.price < this.openRange.min || e.price > this.openRange.max) continue;

                if(this.openMAConfig && ma != null 
                    &&  
                    ((direction === Code.BUY && e.price > ma) || (direction === Code.SELL && e.price < ma))
                ) continue;

                // if( e.price - price < 0 && offsetPercent <= (this.openMaxN+1)*this.openPercentOffset && offsetPercent >= this.openPercentOffset){
                    // 多少张
                    // let num = Math.floor(this.unitValue/e.price/this.adapter.contract_size);
                let num = this.unitValue;
                // if(num <= 0) break;

                let order = { id:null, status:Code.PROCESS,price:e.price,num: num, type:Code.OPEN };
                console.log('openOrder',order.price,order.num)
                let id = await this.adapter.openOrder(order.price,order.num);
                console.log('openOrder end')
                order.id = id;
                this.orders.push(order);
                e.ref = order.id;
                // balance -= order.price * order.num * this.adapter.contract_size + this.unitValue * 0.001;
                balance -= order.num  * this.adapter.contract_size * e.price * ( 1 + 0.001)
                    // num--;
                // }
                
            }

            
        }

        let closeOrders = this.orders.filter(e =>(e.type === Code.CLOSE));
        let closeN = closeOrders.length;
        let orderMap = {};
        closeOrders.forEach(e=> {
            if(e.order) orderMap[e.order.id] = true;
        });
        
        let reserveOpenOrders = this.orders.filter(e =>(e.type === Code.OPEN && !orderMap[e.id]) && e.status === Code.COMPLETE);

        this.basePosition = this.availablePosition;
        reserveOpenOrders.forEach(e => { this.basePosition -= e.num;  });

        console.log('base position',this.basePosition);
        if(this.basePosition < 0){
            console.log('修正数据',this.basePosition);
            this.correctData(reserveOpenOrders);
            return;
        }

        if(closeN < this.closeMaxN && (reserveOpenOrders.length > 0 || this.basePosition >= 1)){
            let num = this.closeMaxN - closeN;

            let tempOrders = this.closeList.filter(e => (e.price>= this.closeRange.min && e.price<=this.closeRange.max));
            if(direction === Code.SELL) tempOrders.reverse();

            // Log('closeN',closeN)
            for (let index = 0; index < tempOrders.length ; index++) {
                let e = tempOrders[index];

                // console.log('reserveOpenOrders',reserveOpenOrders.length)
                if(num <= 0 || (reserveOpenOrders.length <= 0 && this.basePosition < 1) || this.availablePosition <= 0) break;

                if(e.ref) continue;

                // if(e.price < this.closeRange.min || e.price > this.closeRange.max) continue;

                // if(e.price - price > 0 && e.price <= this.maxPrice){
                    // let oldOrders = reserveOpenOrders;
                    // console.log('num',num)
                    let refOrders = reserveOpenOrders.filter(order =>  {
                        let offsetPercent = this.getPercent(order.price,e.price);
                        return (direction === Code.BUY && order.price < e.price && offsetPercent >= this.minClosePercent)||
                        (direction === Code.SELL && order.price > e.price  && offsetPercent >= this.minClosePercent)
                    });
                    // if(refOrders.length === 0) continue;

                    let refOrder,order;
                    let offsetPercent = this.getPercent(this.positionPrice,e.price);
                    if(refOrders.length > 0){
                        console.log('orders---')
                        refOrder = refOrders[refOrders.length-1];
                        reserveOpenOrders = reserveOpenOrders.filter(e => ( e.id !== refOrder.id));
                        order = { id:null, status:Code.PROCESS,price:e.price,num:refOrder.num,order:refOrder,type:Code.CLOSE};
                    }
                    else if(this.basePosition >= 1 && reserveOpenOrders.length === 0 
                        && (
                            ( direction === Code.BUY && e.price > this.positionPrice && offsetPercent >= this.minClosePercent) || 
                            (direction === Code.SELL && e.price < this.positionPrice && offsetPercent >= this.minClosePercent)
                        )
                    ){
                        console.log('position---')
                        let num = Math.min(this.basePosition,this.unitValue,this.availablePosition);
                        this.basePosition -= num;
                        order = { id:null, status:Code.PROCESS,price:e.price,num:num,order:null,type:Code.CLOSE};
                    } 
                    else{
                        continue;
                    }

                    // Log(oldOrders)
                    // this.basePosition -= order.num;
                    this.availablePosition -= order.num;
                    num--;

                    console.log('closeOrder',order.price,order.num)
                    let id = await this.adapter.closeOrder(order.price,order.num);
                    console.log('closeOrder end')
                    order.id = id;
                    this.orders.push(order);
                    e.ref = order.id;
                // }
                
            }
        }
    }

    correctData(reserveOpenOrders){
        let delMap = {};
        let position =  this.availablePosition;
        reserveOpenOrders.forEach(e => {
            position -= e.num;
            if(position < 0) delMap[e.id] = true;
        });

        console.log('remove open orders:',Object.keys(delMap).length);
        this.orders = this.orders.filter(e => !delMap[e.id]);
    }

    async run(){

        let opens = this.orders.filter(e => (e.type === Code.OPEN));
        let opensComplete = opens.filter(e => (e.status === Code.COMPLETE));
        console.log(
            'orders',this.orders.length,
            'opens',opens.length,
            'opens complete',opensComplete.length,
            'close',this.orders.length-opens.length,
            );

        // try{
            await this.updateOrderStatus();
            let price = await this.adapter.getPrice();
            let account = await this.adapter.getAccount()

            if(account.position.length > 1){
                throw new Error('多方向持仓');
            }

            await this.updateListInfo(price);

            if(account.position.length === 1){
                this.availablePosition = account.position[0].available;
                console.log('all position',account.position[0].volume,"available",account.position[0].available)
            }else{
                this.availablePosition = 0;
            }
            await this.completeList(price,account);

        

    }

    async clear(){
        await this.adapter.clear();
    }


    clearItem(e){
        e.ref = null;
    }


}

