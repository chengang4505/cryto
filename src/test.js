// let HuobiRestAPI = require('./index').HuobiRestAPI;

import HuobiRestAPI from './index.js'
import TA from './TA.js'

let accessKey = '6f355162-d0649c48-f23e8167-ez2xc4vb6n';
let secretKey = 'ca63f40b-cee83f36-731994cc-af770';  
// 

const myHuobiRestAPI = new HuobiRestAPI({
    accessKey, secretKey
  });

const myHuobiHbdmAPI = new HuobiRestAPI({
    accessKey, secretKey,
    hostname:'api.hbdm.com'
  });

//   myHuobiRestAPI.get('/v1/account/accounts').then(data => {
//       console.log(data);
//   })  
//   myHuobiRestAPI.get('/v1/account/accounts/22248670/balance').then(data => {
//       console.log(data);
//   })


// myHuobiHbdmAPI.post('/linear-swap-api/v1/swap_balance_valuation',{"valuation_asset":"USDT"}).then(data => {
//     console.log(data);
// })

// myHuobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_position_limit',{"contract_code":"BTC-USDT"}).then(data => {
//     console.log(data);
// })
// myHuobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_available_level_rate').then(data => {
//     console.log(data);
// })
// myHuobiHbdmAPI.get('/linear-swap-api/v1/swap_contract_info',{"contract_code":"ETH-USDT"}).then(data => {
//     console.log(data);
// })

// myHuobiRestAPI.post('/v2/account/transfer',{
//     "from":"spot",
//     "to":"linear-swap",
//     "currency":"usdt",
//     "amount":"160",
//     "margin-account":"USDT"
// }).then(data => {
//     console.log(data);
// })  

// myHuobiHbdmAPI.fetch('/market/depth',{
//     method:'GET',
//     params:{
//         symbol:'ETH_CQ',
//         type:'step6',
//     }
// }).then(data => {
//     logData(data.tick.asks.slice(0,5).reverse());
//     logData(data.tick.bids.slice(0,5));
// })


function logData(datas = []){
    let info = datas.map(e => (`${e[0]}--${e[1]}`)).join('\n');
    console.log(info)
    console.log('#########')
}

// myHuobiHbdmAPI.fetch('/swap-ex/market/history/kline',{method:'GET',params:{contract_code:'ETH-USD',period:'5min',size:100}}).then(data => {
//     console.log(data)
// })


// let period = '60min';
// let size = 120;
// let symbol = 'ETH'
// Promise.all([
//     myHuobiHbdmAPI.fetch('/market/history/kline',{method:'GET',params:{symbol:`${symbol}_CQ`,period:period,size:size}}),
//     // myHuobiHbdmAPI.fetch('/market/history/kline',{method:'GET',params:{symbol:`${symbol}_NW`,period:period,size:size}}),
//     // myHuobiHbdmAPI.fetch('/swap-ex/market/history/kline',{method:'GET',params:{contract_code:`${symbol}-USD`,period:period,size:size}})
// ]).then(([cq,nw]) => {
//     // console.log(cq)
//     // console.log(nw)
//     cq = cq.data;
//     nw = nw.data;
//     let info = [];
//     let attr = 'close';
//     nw.forEach((e,index) => {
//         let cqvalue = cq[index][attr];
//         let nwvalue = e[attr];
//         let offsetPercent = (cqvalue - nwvalue)/nwvalue * 100;
//         info.push(offsetPercent.toFixed(2));
//     });
//     console.log(info.join(','))
// })

const Code  = {
    EMPTY:'empty',
    PROCESS:'process',
    COMPLETE:'complete',
    OPEN:'open',
    CLOSE:'close',
}

class HuobiUsdtContract{
    constructor(symbol){

        this.huobiAPI = new HuobiRestAPI({
            accessKey, secretKey
          });
        
        this.huobiHbdmAPI = new HuobiRestAPI({
            accessKey, secretKey,
            hostname:'api.hbdm.com'
          });

          this.symbol = symbol;
          this.contractCode = `${symbol}-USDT`;
          this.lever_rate = 5;

    }

    getAccount(){

       return Promise.all([
        this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_account_info',{margin_account:'USDT'}),
        this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_position_info',{contract_code:this.contractCode})
       ]).then(([userInfo,positionInfo]) => {
            let obj = userInfo.data[0].contract_detail.filter(e => ( e.symbol === this.symbol ));
            userInfo = obj[0];
            positionInfo = positionInfo.data;
            userInfo.position = positionInfo;
            console.log(userInfo)
            return userInfo;
       });
        // return {"balance": account.Balance,"frozenbalance":account.FrozenBalance,"stocks":account.Stocks,"frozenstocks":account.FrozenStocks}
    }
    // id
    openOrder(price = 0,num = 1,order_price_type = 'limit'){
        // this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_account_position_info',{
        //     margin_account:'USDT',
        // }).then(data => {
        //     // console.log(data);
        //     let obj = data.data.contract_detail.filter(e => ( e.symbol === this.symbol ));
        //     obj = obj[0];
        //     console.log(obj);
        // })
        let args = {
            contract_code:this.contractCode,
            volume:num,
            direction:'sell',
            offset:'open',
            lever_rate: this.lever_rate ,
            price:price,
            order_price_type:order_price_type
        }


        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_order', args ).then(data => {
            console.log(data);
            return data.data.order_id_str;
         //    console.log(data.data[0].contract_detail);
        })
    }
    // id
    closeOrder(price = 100000,num = 1,order_price_type = 'limit'){
        let args = {
            contract_code:this.contractCode,
            volume:num,
            direction:'buy',
            offset:'close',
            lever_rate: this.lever_rate ,
            price:price,
            order_price_type:order_price_type
        }

        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_order', args ).then(data => {
            console.log(data);
         //    console.log(data.data[0].contract_detail);
        })
        // return exchange.Sell(price,num)
    }
    // max 10
    cancelOrder(ids){
        // exchange.CancelOrder(id)
        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_cancel',{
            order_id:ids.join(','),
            contract_code:this.contractCode
        }).then(data => {
            // console.log(data)
        })
    }

    clearAllProcessOrders(){
        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_cancelall',{
            contract_code:this.contractCode
        }).then(data => {
            // let info = data.data.orders.map(e => ({id:e.order_id_str,status:e.status === 6 ? Code.COMPLETE : Code.PROCESS}));
            console.log(data)
            return data;
        })
        // .catch(e => {
        //     console.log(e)
        // })
    }
   
    getProcessOrders(){
        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_openorders',{
            contract_code:this.contractCode
        }).then(data => {
            let info = data.data.orders;
            info.forEach(e =>{
                e.id = e.order_id_str;
                e.oldStatus = e.status;
                e.status = e.oldStatus === 6 ? Code.COMPLETE : Code.PROCESS
            });
            // console.log(info)
            return info;
        })
    }
     // Staus
    // max 50
    getOrderInfo(ids){
        // console.log(ids.join(','));
        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_order_info',{
            order_id:ids.join(','),
            contract_code:this.contractCode
        }).then(data => {
            let status = data.data.map(e => (e.status === 6 ? Code.COMPLETE : Code.PROCESS));
            // console.log(status)
            return status;
        })
    
    }
    getPrice(){
        return this.huobiHbdmAPI.fetch('/linear-swap-ex/market/detail/merged',{
            method:'GET',
            params:{
                contract_code:this.contractCode,
            }
        }).then(data => {
            // console.log(+data.tick.close);
            return +data.tick.close;
        })
    }
    getMa(period = '60min',type = 20){
        //PERIOD_H1 PERIOD_M15
        return this.huobiHbdmAPI.fetch('/linear-swap-ex/market/history/kline',{
            method:'GET',
            params:{
                contract_code:this.contractCode,
                period:period,
                size: type
            }
        }).then(data => {
            data = data.data.map(e => {
                return {Open:e.open,High:e.high,Low:e.low,Close:e.close}
            });
            // console.log(data)
            var mas = TA.MA(data, type);
            // console.log(mas[mas.length-1])
            return mas[mas.length-1];
        })
        // var records = exchange.GetRecords(PERIOD_H1)
        // return mas[mas.length-1];
    }
}

var ex = new HuobiUsdtContract('BTC');

try{
// 828755543047880700 828755543047880706
// ex.openOrder(62000,1);
// ex.closeOrder(60000,1)
// ex.cancelOrder(['828758343987728384']);
// ex.getAccount();
//828758343987728384
// ex.getOrderInfo(['828758343987728384']);
// ex.getProcessOrders();
ex.clearAllProcessOrders();
// ex.getPrice();
// ex.getMa();
}catch(e){
    console.log(e)
}