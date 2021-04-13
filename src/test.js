// let HuobiRestAPI = require('./index').HuobiRestAPI;

import HuobiRestAPI from './lib/huobiRequest.js'
import TA from './lib/TA.js'

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


let period = '30min';
let size = 120;
let symbol = 'FIL'
Promise.all([
    myHuobiHbdmAPI.fetch('/market/history/kline',{method:'GET',params:{symbol:`${symbol}_CQ`,period:period,size:size}}),
    // myHuobiHbdmAPI.fetch('/market/history/kline',{method:'GET',params:{symbol:`${symbol}_NW`,period:period,size:size}}),
    myHuobiHbdmAPI.fetch('/swap-ex/market/history/kline',{method:'GET',params:{contract_code:`${symbol}-USD`,period:period,size:size}})
]).then(([cq,nw]) => {
    // console.log(cq)
    // console.log(nw)
    cq = cq.data;
    nw = nw.data;
    let info = [];
    let attr = 'close';
    nw.forEach((e,index) => {
        let cqvalue = cq[index][attr];
        let nwvalue = e[attr];
        let offsetPercent = (cqvalue - nwvalue)/nwvalue * 100;
        info.push(offsetPercent.toFixed(2));
    });
    console.log(info.join(','))
})
