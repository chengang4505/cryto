// let HuobiRestAPI = require('./index').HuobiRestAPI;

import HuobiRequest from '../lib/huobiRequest.js'
import TA from '../lib/TA.js'

const Code  = {
    EMPTY:'empty',
    PROCESS:'process',
    COMPLETE:'complete',
    OPEN:'open',
    CLOSE:'close',
}

export default class UsdtContract{
    constructor(symbol = 'FIL',option = {}){
        let {accessKey,secretKey} = option;

        this.huobiAPI = new HuobiRequest({
            accessKey, secretKey
          });
        
        this.huobiHbdmAPI = new HuobiRequest({
            accessKey, secretKey,
            hostname:'api.hbdm.com'
          });

          this.symbol = symbol;
          this.contractCode = `${symbol}-USDT`;
        //   杠杆倍数
          this.lever_rate = 5;
        //   账户信息
          this.accountInfo = null;
        //   即1张合约对应多少标的
          this.contract_size = null;

    }

    async init(callback){

        // 1张合约对应多少标的
        await this.huobiHbdmAPI.fetch('/linear-swap-api/v1/swap_contract_info',{
            method:'GET',
            params:{
                contract_code:this.contractCode,
            }
        }).then(data => {
            let config = data.data[0]
            this.contract_size = config.contract_size;
        })

        // 设置倍数
        await this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_switch_lever_rate',{
            contract_code:this.contractCode,
            lever_rate:this.lever_rate,
        })

        await this.getAccount();

        // await this.clearAllProcessOrders().catch(e => {});

        callback && callback();
    }

    async clear(){
        await this.clearAllProcessOrders().catch(e => {})

        if(this.accountInfo.position.length > 0){
            let volume = this.accountInfo.position[0].volume;
            console.log('clear position',volume)
            await this.closePostion(volume);
        }

    }

    getAccount(){
        console.log('getAccount')

        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_account_info',{margin_account:'USDT'})
        .then(accountInfo => {
            let obj = accountInfo.data[0].contract_detail.filter(e => ( e.symbol === this.symbol ));
            accountInfo = obj[0];
            return accountInfo;
        })
        .then(accountInfo => {
            return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_position_info',{contract_code:this.contractCode}).then(positionInfo => {
                positionInfo = positionInfo.data;
                accountInfo.position = positionInfo;
                return accountInfo
            })
        })
        .then(accountInfo => {
            return this.huobiHbdmAPI.fetch('/linear-swap-api/v1/swap_price_limit',{method:'GET',params:{contract_code:this.contractCode}}).then(priceLimit => {
                accountInfo.high_limit = priceLimit.data[0].high_limit;
                accountInfo.low_limit = priceLimit.data[0].low_limit;
                console.log('getAccount end')
                this.accountInfo = accountInfo;
                return accountInfo;
            })
        })
   
    }
    // id
    openOrder(price = 100000,num = 1,order_price_type = 'limit'){
        console.log('openOrder')

        let args = {
            contract_code:this.contractCode,
            volume:num,
            direction:'buy',
            offset:'open',
            lever_rate: this.lever_rate ,
            price:price,
            order_price_type:order_price_type
        }


        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_order', args ).then(data => {
            // console.log(data);
            return data.data.order_id_str;
         //    console.log(data.data[0].contract_detail);
        })
    }
    // id
    closeOrder(price = 0,num = 1,order_price_type = 'limit'){
        console.log('closeOrder')

        let args = {
            contract_code:this.contractCode,
            volume:num,
            direction:'sell',
            offset:'close',
            lever_rate: this.lever_rate ,
            price:price,
            order_price_type:order_price_type
        }

        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_order', args ).then(data => {
            // console.log(data);
         //    console.log(data.data[0].contract_detail);
         return data.data.order_id_str;
        })
        // return exchange.Sell(price,num)
    }
    // max 10
    cancelOrder(ids){
        console.log('cancelOrder',ids.length)

        // exchange.CancelOrder(id)
        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_cancel',{
            order_id:ids.join(','),
            contract_code:this.contractCode
        }).then(data => {
            // console.log(data)
            return data;
        })
    }

    closePostion(volume = 1){
        console.log('closePostion')

        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_lightning_close_position',{
            contract_code:this.contractCode,
            volume:volume,
            direction:'sell'
        }).then(data => {
            // let info = data.data.orders.map(e => ({id:e.order_id_str,status:e.status === 6 ? Code.COMPLETE : Code.PROCESS}));
            // console.log(data)
            return data;
        })
    }

    clearAllProcessOrders(){
        console.log('clearAllProcessOrders')

        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_cancelall',{
            contract_code:this.contractCode
        }).then(data => {
            // let info = data.data.orders.map(e => ({id:e.order_id_str,status:e.status === 6 ? Code.COMPLETE : Code.PROCESS}));
            // console.log(data)
            return data;
        })
        // .catch(e => {
        //     console.log(e)
        // })
    }
   
    getProcessOrders(){
        console.log('getProcessOrders')

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
        console.log('getOrderInfo',ids.length);

        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_order_info',{
            order_id:ids.join(','),
            contract_code:this.contractCode
        }).then(data => {
            let status = data.data.map(e => ({id:e.order_id_str, status:e.status === 6 ? Code.COMPLETE : Code.PROCESS}));
            // console.log(status)
            return status;
        })
    
    }
    getPrice(){
        console.log('getPrice');

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
    getMa(type = 20,period = '60min'){
        console.log('getMa');

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
    }
}