
function precision(num,p = 1){
    // return _N(num,p);
    return +(num.toFixed(p))
}

function getPrecision(num){
    let v = num * 0.001;
    let n = 0;
    while(v < 1){
        n++;
        v *= 10;
    }
    return n;
}

const Code  = {
    EMPTY:'empty',
    PROCESS:'process',
    COMPLETE:'complete',
    OPEN:'open',
    CLOSE:'close',
    SELL:'sell',
    BUY:'buy',
}


// grid item
// { ref,price}

// order
// { id, status,price,num,order,type}

export default class Trader{
    // static Staus = Staus;
    constructor(option = {},adapter,type = Code.BUY){
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
        } = option
       
        this.type = type;
        this.orders = [];
        this.adapter = adapter;

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
        this.position = 0;
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
        let orderMap = {};
        this.orders.forEach(e =>{ orderMap[e.id] = e; });

        let removeOrderMap = {};
        let cancelOrders = [];

        // this.maxPrice = Infinity;
        // this.closeRange = { max:Infinity,min:-Infinity };
        let temp = this.closeList.filter(e => (e.price > price));
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
                this.clear(e);
            }
            else if(e.price > this.closeRange.max || e.price < this.closeRange.min){
                cancelOrders.push(order);
                removeOrderMap[order.id] = true;
                this.clear(e);
            }

        })


        // this.minPrice = -Infinity;
        temp =  this.openList.filter(e => (e.price < price));
        if(temp.length === 0){
            this.openRange = { max:-1,min:-1 };
        }else{
            temp.reverse();
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
                this.clear(e);
            }
            else if( order.status !== Code.COMPLETE && (e.price < this.openRange.min || e.price > this.openRange.max || e.price > this.openThreshold)){
                cancelOrders.push(order);
                removeOrderMap[order.id] = true;
                this.clear(e);
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
        // cancelOrders.forEach(order => {
        //     exTest.cancelOrder(order.id);
        //     if(order.type === Code.CLOSE && !order.order){
        //         this.position += order.num;
        //     }
        // })
        // Log('this.orders',this.orders.length)
    }

    getPercent(base,v){
        return Math.abs(v-base)/base * 100;
    }

    getCharge(price,num,percent){
        return price * num * percent * 0.01;
    }

    async completeList(price,account){
        let balance = account.margin_available * account.lever_rate;
        console.log('margin_available',account.margin_available,'balance',balance,'position',this.position)
        let minCharge = this.unitValue * this.adapter.contract_size * price * 0.0025;

        if(balance > minCharge && price <= this.openThreshold){

            // let num = this.openMaxN - openN;
            let ma = null;
            if(this.openMAConfig && this.openMAConfig.period && this.openMAConfig.type){
                // console.log('openMAConfig',this.openMAConfig)
                ma = await this.adapter.getMa(this.openMAConfig.type,this.openMAConfig.period); 
                console.log('ma',ma);
            }

            // let tempOrders = this.openList.filter(e => (e.price>= this.openRange.min && e.price<=this.openRange.max));

            // Log(ma)
            for (let index = this.openList.length-1; index >=0 ; index--) {
                let e = this.openList[index];

                if(balance < minCharge + this.unitValue  * this.adapter.contract_size * e.price) break;

                if(e.ref) continue;
                if(e.price < this.openRange.min || e.price > this.openRange.max) continue;

                if(this.openMAConfig && ma != null &&  e.price > ma) continue;

                // if( e.price - price < 0 && offsetPercent <= (this.openMaxN+1)*this.openPercentOffset && offsetPercent >= this.openPercentOffset){
                    // 多少张
                    // let num = Math.floor(this.unitValue/e.price/this.adapter.contract_size);
                let num = this.unitValue;
                // if(num <= 0) break;

                let order = { id:null, status:Code.PROCESS,price:e.price,num: num, type:Code.OPEN };
                console.log('openOrder',order.price,order.num)
                let id = await this.adapter.openOrder(order.price,order.num);
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

        this.position -= reserveOpenOrders.length;
        console.log('base position',this.position);

        if(closeN < this.closeMaxN && (reserveOpenOrders.length > 0 || this.position >= 1)){
        // if( (reserveOpenOrders.length > 0 || this.position > 0.001)){
            let num = this.closeMaxN - closeN;
            // Log('closeN',closeN)
            for (let index = 0; index < this.closeList.length ; index++) {
                let e = this.closeList[index];

                // console.log('reserveOpenOrders',reserveOpenOrders.length)
                if(num <= 0 || (reserveOpenOrders.length <= 0 && this.position < 1)) break;

                if(e.price < this.closeRange.min || e.price > this.closeRange.max) continue;

                // let offsetPercent = this.getPercent(price,e.price);
                // if(e.price - price > 0 && e.price <= this.maxPrice){
                    // let oldOrders = reserveOpenOrders;
                    // console.log('num',num)
                    let refOrders = reserveOpenOrders.filter(order => ( e.price - order.price >0 && this.getPercent(order.price,e.price) >= this.minClosePercent ));
                    // if(refOrders.length === 0) continue;

                    let refOrder,order;
                    if(refOrders.length > 0){
                        console.log('orders---')
                        refOrder = refOrders[refOrders.length-1];
                        reserveOpenOrders = reserveOpenOrders.filter(e => ( e.id !== refOrder.id));
                        order = { id:null, status:Code.PROCESS,price:e.price,num:refOrder.num,order:refOrder,type:Code.CLOSE};
                    }
                    else if(this.position >= 1 && reserveOpenOrders.length === 0 && this.getPercent(this.positionPrice,e.price) >= this.minClosePercent  ){
                        console.log('position---')
                        let num = Math.min(this.position,this.unitValue);
                        this.position -= num;
                        order = { id:null, status:Code.PROCESS,price:e.price,num:num,order:null,type:Code.CLOSE};
                    } 
                    else{
                        continue;
                    }

                    // Log(oldOrders)
                    this.position -= order.num;
                    num--;

                    console.log('closeOrder',order.price,order.num)
                    let id = await this.adapter.closeOrder(order.price,order.num);
                    order.id = id;
                    this.orders.push(order);
                    e.ref = order.id;
                // }
                
            }
        }
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
                this.position = account.position[0].available;
                console.log('all position',account.position[0].volume)
            }else{
                this.position = 0;
            }
            await this.completeList(price,account);

        

    }


    clear(e){
        e.ref = null;
    }


}

