import Adapter from './adapter.js'
import { precision ,getPrecision} from '../lib/utils.js'
import { Code } from '../lib/const.js'



function Log(...args){
    console.log(...args);
}

function getPercent(base,v){
    return Math.abs(v-base)/base * 100;
}


export default class Trader{
    constructor(option){
        let {
            lever_rate,
            symbol,
            unitValue
        } = option;
        this.option = option;
        this.symbol = symbol;
        this.unitValue = unitValue;
        this.precision = 0;
        this.adapter = new Adapter(this.symbol,this.option.keyConfig,lever_rate);
    }

    // async init(cb){
    //     if(this.initFlag) return;
    //     await this.adapter.init(cb);
    //     this.initFlag = true;
    // }


    async run(){

        let { profit, addPercent,unitN } = this.option ;

        Log('=============new===========');

        let account = await this.adapter.getAccount()
        let margin = account.margin_available;

        let price = await this.adapter.getPrice();
        let openOrders = await this.adapter.getProcessOrders();

        // 挂单多于1个
        if(openOrders.length >= 2){
            Log('clearn openOrders:',openOrders.length);
            this.adapter.clearAllProcessOrders();
            return;
        }

        if(!this.initFlag){
            Log('---init---')
            await this.adapter.init();
            if(!this.unitValue)  this.unitValue = Math.floor( margin * account.lever_rate / (this.adapter.contract_size * price) / unitN );
            this.precision = getPrecision(price);
            this.initFlag = true;
            Log('init unit',this.unitValue,'precision',this.precision);
        }

        let availableUnit = Math.floor(margin * account.lever_rate / (this.adapter.contract_size * price));
        Log('price:',price,'margin:',margin,'available unit:',availableUnit);

        // 当前挂单
        let openOrder = openOrders.length === 1 ? openOrders[0] : null;
        if(account.position.length === 0){
            if(openOrder){
                Log('init clearn openOrders:',openOrder.offset,openOrder.direction);
                this.adapter.clearAllProcessOrders();
                return;
            }

            let ma = await this.adapter.getMa()
            Log('ma:',ma);

            if ( price >= ma) {
                Log('init sell',price);
                this.adapter.openOrder(price, this.unitValue, 'sell', 'optimal_20_fok');
            }else {
                Log('init buy',price);
                this.adapter.openOrder(price, this.unitValue , 'buy', 'optimal_20_fok');
            }

        }

        // return


        if (account.position.length > 0) {
            let pos = account.position[0];
            
            
            let holdValue = pos.cost_open;
            Log('position:',pos.volume,'holdValue:',holdValue);

            let value = getPercent(holdValue,price);

            // Log('value:',value);

            // 做空
            if (pos.direction == 'sell') {
                let isProfit = holdValue > price;
                Log('Sell:','profit',profit,'addPercent',addPercent,'value:',isProfit ? value : -1 * value,);
                if (isProfit && value >= profit*0.5) {
                    //盈利
                    if(!openOrder || openOrder.offset !== 'close'){
                        let closePrice = holdValue - holdValue * profit * 0.01;
                        closePrice = precision(closePrice,this.precision);
                        Log('sell---close',value.toFixed(4),'closePrice',closePrice);
                        this.adapter.closeOrder(closePrice,pos.volume, 'buy');
                    }
                    // this.adapter.closeOrder(price,pos.volume, 'buy', 'optimal_20_fok');
                }
                
                if(!isProfit && value >= addPercent * 0.5  && availableUnit > 1) {
                    //负盈利
                    if(!openOrder || openOrder.offset !== 'open'){
                        let openPrice = holdValue + holdValue * addPercent * 0.01;
                        openPrice = precision(openPrice,this.precision);
                        Log('sell---add',value.toFixed(4),'openPrice',openPrice);
                        this.adapter.openOrder(openPrice,Math.min(pos.volume,availableUnit), 'sell');
                    }
                    // this.adapter.openOrder(price,Math.min(pos.volume,availableUnit), 'sell', 'optimal_20_fok');
                } 
            }

            // 做多
            if (pos.direction == 'buy') {
                let isProfit = holdValue < price;
                Log('Buy:','profit',profit,'addPercent',addPercent,'value:',isProfit ? value : -1 * value,);

                if (isProfit && value >= profit*0.5) {
                    //盈利
                    // this.adapter.closeOrder(price,pos.volume, 'sell', 'optimal_20_fok');
                    if(!openOrder || openOrder.offset !== 'close'){
                        let closePrice = holdValue + holdValue * profit * 0.01;
                        closePrice = precision(closePrice,this.precision);
                        Log('buy---close',value.toFixed(4),'closePrice',closePrice);
                        this.adapter.closeOrder(closePrice,pos.volume, 'sell');

                    }
                }
                
                if (!isProfit && value >= addPercent*0.5 && availableUnit > 1 ) {
                    //负盈利
                    if(!openOrder || openOrder.offset !== 'open'){
                        let openPrice = holdValue - holdValue * addPercent * 0.01;
                        openPrice = precision(openPrice,this.precision);
                        Log('buy---add',value.toFixed(4),'openPrice',openPrice);
                        this.adapter.openOrder(openPrice,Math.min(pos.volume,availableUnit), 'buy');
                    }
                    // this.adapter.openOrder(price, Math.min(pos.volume,availableUnit), 'buy', 'optimal_20_fok');
                }
            }

            if(
                (account.available > 0 && available.frozen > 0)
            ){
                Log('clear available-frozen info:',account.available,account.frozen);
                this.adapter.clearAllProcessOrders();
                return;
            }
        }

    }
}