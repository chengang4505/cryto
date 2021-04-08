
function precision(num,p = 1){
    // return _N(num,p);
    return +(num.toFixed(p))
}

const Code  = {
    EMPTY:'empty',
    PROCESS:'process',
    COMPLETE:'complete',
    OPEN:'open',
    CLOSE:'close',
}

// let exTest = {
//     // {"balance":27996,"frozenbalance":2004,"stocks":1,"frozenstocks":0}
//     GetAccount(){
//         var account = exchange.GetAccount()
//         return {"balance": account.Balance,"frozenbalance":account.FrozenBalance,"stocks":account.Stocks,"frozenstocks":account.FrozenStocks}
//     },
//     // id
//     openOrder(price,num){
//         return exchange.Buy(price,num)
//     },
//     // id
//     closeOrder(price,num){
//         return exchange.Sell(price,num)
//     },
//     cancelOrder(id){
//         exchange.CancelOrder(id)
//     },
//     // Staus
//     getOrderInfo(id){
//         var order = exchange.GetOrder(id);
//         let status = order.Status === 1 ? Code.COMPLETE : Code.PROCESS;
//         return { status: status }
//     },
//     getPrice(){
//          var ticker = exchange.GetTicker()
//         return ticker.Last;
//     },
//     getMa(period = 10){
//         //PERIOD_H1 PERIOD_M15
//         var records = exchange.GetRecords(PERIOD_H1)
//         var mas = TA.MA(records, period);
//         return mas[mas.length-1];
//     }
// }


// grid item
// { ref,price}

// order
// { id, status,price,num,order,type}

export default class Trader{
    // static Staus = Staus;
    constructor(option = {},adapter){
        let {
            openPercentOffset = 1,
            closePercentOffset = 1,
            minClosePercent = 1,
            openThreshold = 155.0,
            openMax = 3,
            closeMax = 5,
            unitValue= 8,
        } = option
       
        this.orders = [];
        this.adapter = adapter;

        this.openPercentOffset = openPercentOffset;
        this.closePercentOffset = closePercentOffset;
        this.minClosePercent = minClosePercent;

        this.openThreshold = openThreshold;
        this.openMax = openMax;
        this.closeMax = closeMax;
        this.maxPrice = Infinity;
        this.minPrice = -Infinity;

        // this.unit = 0.2;
        // 多少张
        this.unitValue = precision(unitValue);
        this.stocks = 0;

        // this.gridCount = 1;

        this.highPrice = 200;
        this.lowPrice = 120;
        this.completeOrders = [];

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
            price = precision(price);
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

        this.maxPrice = Infinity;
        let temp = this.closeList.filter(e => (e.price > price));
        if(temp.length > this.closeMax){
            this.maxPrice = temp[this.closeMax-1].price;
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
            else if(e.price > this.maxPrice){
                cancelOrders.push(order);
                removeOrderMap[order.id] = true;
                this.clear(e);
            }

        })


        this.minPrice = -Infinity;
        temp =  this.closeList.filter(e => (e.price < price));
        if(temp.length > this.openMax){
            this.minPrice = temp[temp.length - this.openMax].price;
        }

        // Log('price',this.minPrice)


        this.openList.forEach(e => {
            if(!e.ref) return;

            let order = orderMap[e.ref];
            // let offsetPercent = this.getPercent(price,e.price);
            if(!order || removeOrderMap[e.ref]){
                this.clear(e);
            }
            else if( (e.price < this.minPrice || e.price > this.openThreshold) && order.status !== Code.COMPLETE){
                cancelOrders.push(order);
                removeOrderMap[order.id] = true;
                this.clear(e);
            }
        })

        // Log('cancelOrders',cancelOrders.length)
        if(cancelOrders.length > 0){
            let ids = cancelOrders.map(e => e.id);
            await this.adapter.cancelOrder(ids);
        }
        // cancelOrders.forEach(order => {
        //     exTest.cancelOrder(order.id);
        //     if(order.type === Code.CLOSE && !order.order){
        //         this.stocks += order.num;
        //     }
        // })
        this.orders = this.orders.filter(e => !removeOrderMap[e.id]);
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
        console.log('margin_available',account.margin_available,'balance',balance)
        // let minCharge = this.getCharge(this.highPrice,this.unit,0.25);
        let minCharge = this.unitValue * this.adapter.contract_size * price * 0.0025
        // let openN = this.orders.filter(e =>(!e.order)).length;
        // Log('openN',openN)
        if(balance > minCharge && price <= this.openThreshold){

            // let num = this.openMax - openN;
            let ma = await this.adapter.getMa(5,'5min'); 
            // Log(ma)
            for (let index = this.openList.length-1; index >=0 ; index--) {
                let e = this.openList[index];

                if(e.price > price) continue;

                // Log('a',e.price - price)
                if(balance < minCharge + this.unitValue  * this.adapter.contract_size * e.price || e.price < this.minPrice) break;

                if(e.ref) continue;
                if(e.price > ma) continue;
                // if(e.price > 32000) continue;

                // Log((this.openMax+1)*this.openPercentOffset)

                // let offsetPercent = this.getPercent(price,e.price);

                // Log('offsetPercent',offsetPercent,e.price)
                if( e.price < price){
                // if( e.price - price < 0 && offsetPercent <= (this.openMax+1)*this.openPercentOffset && offsetPercent >= this.openPercentOffset){
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
                }
                
            }

            
        }

        let closeOrders = this.orders.filter(e =>(e.type === Code.CLOSE));
        let closeN = closeOrders.length;
        let orderMap = {};
        closeOrders.forEach(e=> {
            if(e.order) orderMap[e.order.id] = true;
        });
        
        let reserveOpenOrders = this.orders.filter(e =>(e.type === Code.OPEN && !orderMap[e.id]) && e.status === Code.COMPLETE);
        // let upOrders = [];
        // let downOrders = [];
        // reserveOpenOrders.forEach(e => {
        //     if(e.price >= price) upOrders.push(e);
        //     else downOrders.push(e);
        // });
        // downOrders.sort((a,b) => {
        //     return a.price - b.price;
        //     // return b.price - a.price;
        // });
        
        // reserveOpenOrders = [...downOrders,...upOrders];
        // if(reserveOpenOrders.length) Log(reserveOpenOrders)

        if(closeN < this.closeMax && (reserveOpenOrders.length > 0 || this.stocks > 0.001)){
        // if( (reserveOpenOrders.length > 0 || this.stocks > 0.001)){
            let num = this.closeMax - closeN;
            // Log('closeN',closeN)
            for (let index = 0; index < this.closeList.length ; index++) {
                let e = this.closeList[index];

                if(num <= 0 || (reserveOpenOrders.length<= 0 && this.stocks <= 0.01)) break;

                // let offsetPercent = this.getPercent(price,e.price);
                if(e.price - price > 0 && e.price <= this.maxPrice){
                // if(e.price - price > 0 && offsetPercent <= (this.closeMax+1)*this.closePercentOffset){
                // if(e.price - price > 0 && offsetPercent <= (this.closeMax+1)*this.closePercentOffset && offsetPercent >= this.closePercentOffset){
                    // let refOrder = reserveOpenOrders.shift();
                    // let oldOrders = reserveOpenOrders;
                    let refOrders = reserveOpenOrders.filter(order => ( e.price - order.price >0 && this.getPercent(order.price,e.price) >= this.minClosePercent ));
                    // if(refOrders.length === 0) continue;

                    let refOrder,order;
                    if(refOrders.length > 0){
                        refOrder = refOrders[refOrders.length-1];
                        reserveOpenOrders = reserveOpenOrders.filter(e => ( e.id !== refOrder.id));
                        order = { id:null, status:Code.PROCESS,price:e.price,num:refOrder.num,order:refOrder,type:Code.CLOSE};
                    }
                    //  else if(this.stocks > 0.01){
                    //     let num = Math.min(this.stocks,this.unitValue / e.price);
                    //     num = precision(num);
                    //     // Log('num',num,this.stocks)
                    //     this.stocks -= num;
                    //     order = { id:null, status:Code.PROCESS,price:e.price,num:num,order:null,type:Code.CLOSE};
                    // } 
                    else{
                        continue;
                    }

                    // Log(oldOrders)
                    console.log('closeOrder',order.price,order.num)
                    let id = await this.adapter.closeOrder(order.price,order.num);
                    // if(!id) Log(order);
                    order.id = id;
                    
                    this.orders.push(order);
                    e.ref = order.id;

                    num--;
                }
                
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
            await this.updateListInfo(price);
            let account = await this.adapter.getAccount()
            await this.completeList(price,account);

        

    }


    clear(e){
        e.ref = null;
    }


}


let n = 0;


function main() {
    let trader = new Trader({ 
        openPercentOffset,
        closePercentOffset,
        minClosePercent,
        openMax,
        closeMax,
        unitValue});

    Log('list Len',trader.openList.length);
        // trader.updateOrderStatus();
        // let price = exTest.getPrice();
        // trader.updateListInfo(price);
        // trader.completeList(price);
    
        // trader.run();
    //test

    let account= exTest.GetAccount()
    let price = exTest.getPrice();
    Log('n',account);
    let startValue = account.balance + account.frozenbalance + (account.stocks+account.frozenstocks)*price;
    Log('start:',startValue);
    // Log(trader);
    let n = 10000;
    //  while(n > 0){
     while(true){
        //  trader.run();

        trader.updateOrderStatus();
         let price = exTest.getPrice();
         trader.updateListInfo(price);


        // let open = trader.orders.filter(e => (e.type === Code.OPEN));
        // let openCom = open.filter(e => (e.status === Code.COMPLETE));
        // Log('open complete',openCom.length,'open process',open.length-openCom.length,'close',trader.orders.length - open.length)

         let account = exTest.GetAccount()
         trader.completeList(price,account);


       
        Sleep(1000*60*2)
        
         n--;
    }

    Log('openList',trader.openList)
    Log('closeList',trader.closeList)
    Log('orders',trader.orders)
    Log('completeOrders len',trader.completeOrders.length)
    Log('completeOrders len init',trader.completeOrders.filter(e => !e.open).length)
    Log('completeOrders',trader.completeOrders)

    account= exTest.GetAccount()
    price = exTest.getPrice();
    Log('n',account);
    let endValue = account.balance + account.frozenbalance + (account.stocks+account.frozenstocks)*price;
    Log('end:', endValue );
    Log('value:', endValue - startValue ,'percent',(endValue - startValue)/startValue*100);

}

function onerror(){
    Log('err')
}

function onexit(){
    // Log('n',n);
    // Log('testes');
}

// function onexit(){
//     var beginTime = new Date().getTime()
//     while(true){
//         var nowTime = new Date().getTime()
//         Log("程序停止倒计时..扫尾开始，已经过去：", (nowTime - beginTime) / 1000, "秒！")
//         Sleep(1000)
//     }
// }