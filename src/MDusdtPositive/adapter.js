
import HuobiRequest from '../lib/huobiRequest.js'
import TA from '../lib/TA.js'
import { Code } from '../lib/const.js'

export default class UsdtContract{
    constructor(symbol,option = {},lever_rate){
        // this.direction = direction;

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
          this.lever_rate = lever_rate;
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

        // await this.getAccount();

        // await this.clearAllProcessOrders().catch(e => {});

        callback && callback();
    }

    async clear(){
        await this.clearAllProcessOrders().catch(e => {})

        await this.getAccount();

        if(this.accountInfo.position.length > 0){
            let position = this.accountInfo.position[0];
            let volume = position.volume;
            console.log('clear position',volume,position.direction)
            await this.closePostion(volume,position.direction === Code.BUY ? Code.SELL : Code.BUY );
        }

    }

    getAccount(){
        // console.log('getAccount')

        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_account_info',{margin_account:'USDT'})
        .then(accountInfo => {
            let obj = accountInfo.data[0].contract_detail.filter(e => ( e.symbol === this.symbol ));
            accountInfo = obj[0];
            this.accountInfo = accountInfo;
            return accountInfo;
        })
        .then(accountInfo => {
            return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_position_info',{contract_code:this.contractCode}).then(positionInfo => {
                positionInfo = positionInfo.data;
                accountInfo.position = positionInfo;
                this.accountInfo = accountInfo;
                // console.log('accountInfo--',accountInfo)
                return accountInfo
            })
        })
        // .then(accountInfo => {
        //     return this.huobiHbdmAPI.fetch('/linear-swap-api/v1/swap_price_limit',{method:'GET',params:{contract_code:this.contractCode}}).then(priceLimit => {
        //         accountInfo.high_limit = priceLimit.data[0].high_limit;
        //         accountInfo.low_limit = priceLimit.data[0].low_limit;
        //         // console.log('getAccount end')
        //         this.accountInfo = accountInfo;
        //         return accountInfo;
        //     })
        // })
   
    }
    // id
    openOrder(price = 100000,num = 1,direction,order_price_type = 'limit'){
        // console.log('openOrder')

        let args = {
            contract_code:this.contractCode,
            volume:num,
            direction:direction,
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
    closeOrder(price = 0,num = 1,direction,order_price_type = 'limit'){
        // console.log('closeOrder')
        // let direction = this.direction === Code.BUY ? Code.SELL : Code.BUY;
        let args = {
            contract_code:this.contractCode,
            volume:num,
            direction:direction,
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

    closePostion(volume = 1,direction){
        // console.log('closePostion')

        // if(!direction)
        // direction = direction === Code.BUY ? Code.SELL : Code.BUY;

        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_lightning_close_position',{
            contract_code:this.contractCode,
            volume:volume,
            direction:direction
        }).then(data => {
            // let info = data.data.orders.map(e => ({id:e.order_id_str,status:e.status === 6 ? Code.COMPLETE : Code.PROCESS}));
            // console.log(data)
            return data;
        })
    }

    clearAllProcessOrders(){
        // console.log('clearAllProcessOrders')

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
        // console.log('getProcessOrders')

        return this.huobiHbdmAPI.post('/linear-swap-api/v1/swap_cross_openorders',{
            contract_code:this.contractCode
        }).then(data => {
            let info = data.data.orders || [];
            // info.forEach(e =>{
            //     e.id = e.order_id_str;
            //     e.oldStatus = e.status;
            //     e.status = e.oldStatus === 6 ? Code.COMPLETE : Code.PROCESS
            // });
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
        // console.log('getPrice');

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
    getMa(type = 5,period = '5min'){
        // console.log('getMa');
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

            let arr = TA.MA(data, type);
            return arr[arr.length-1];
        })
    }
    getMaDir(type = [20,30,60],period = '30min'){ 
        let [type1,type2,type3] = type;
        return this.huobiHbdmAPI.fetch('/linear-swap-ex/market/history/kline',{
            method:'GET',
            params:{
                contract_code:this.contractCode, 
                period:period,
                size: Math.max(type1,type2,type3)+5
            }
        }).then(data => {
            data = data.data.map(e => {
                return {Open:e.open,High:e.high,Low:e.low,Close:e.close}
            });

            let arr = TA.MA(data, type1);
            let dir1 = arr[arr.length-2] - arr[arr.length-3];
            let ma1 = arr[arr.length-2];

            arr = TA.MA(data, type2);
            let dir2 = arr[arr.length-2] - arr[arr.length-3];
            let ma2 = arr[arr.length-2];

            arr = TA.MA(data, type3);
            let dir3 = arr[arr.length-2] - arr[arr.length-3];
            let ma3 = arr[arr.length-2];


            return {
                dir1,dir2,dir3,ma1,ma2,ma3,
               
            };
        })

    }

    getBollInfo(period = '15min'){ 
        
        return this.huobiHbdmAPI.fetch('/linear-swap-ex/market/history/kline',{
            method:'GET',
            params:{
                contract_code:this.contractCode, 
                period:period,
                size: 25
            }
        }).then(data => {
            data = data.data.map(e => {
                return {Open:e.open,High:e.high,Low:e.low,Close:e.close}
            });
            var boll = TA.BOLL(data, 20, 2)
            var upLine = boll[0]
            var midLine = boll[1]
            var downLine = boll[2]

            var bollInfo = {
                updir:upLine[upLine.length-1]- upLine[upLine.length-2],
                downdir:downLine[downLine.length-1]- downLine[downLine.length-2],
                midValue:midLine[midLine.length-1],
                upValue:upLine[upLine.length-1],
                downValue:downLine[downLine.length-1],
            }

            return bollInfo
        })

    }

    gettest(type =20,period = '15min'){
        // let [type1,type2] = type;
        return this.huobiHbdmAPI.fetch('/linear-swap-ex/market/history/kline',{
            method:'GET',
            params:{
                contract_code:this.contractCode,
                period:period,
                size: type+50
            }
        }).then(data => {
            data = data.data.map(e => {
                return {Open:e.open,High:e.high,Low:e.low,Close:e.close}
            });

            let arr = TA.MA(data, type);
            arr = arr.filter(e => !isNaN(e));

            let dirs = [];
            // let dir1 = arr[arr.length-2] - arr[arr.length-3];
            let offset = 1;
            arr.forEach((e,index) => {
                if(index >= offset){
                    dirs.push(arr[index] - arr[index-offset]);
                }else{
                    dirs.push(0);
                }
            })

            dirs = dirs.map(e => { return (e/2000*100).toFixed(4) } );

           

            return dirs;
        })

    }
}