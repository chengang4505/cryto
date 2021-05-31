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
            unitValue,
            clearPercent
        } = option;
        this.option = option;
        this.symbol = symbol;
        this.unitValue = unitValue;
        this.clearPercent = clearPercent;
        this.precision = 0;
        this.adapter = new Adapter(this.symbol,this.option.keyConfig,lever_rate);
    }

    // async init(cb){
    //     if(this.initFlag) return;
    //     await this.adapter.init(cb);
    //     this.initFlag = true;
    // }


    async run(){

        let { profit, addPercent,addRatio,baseUnit,unitN,direction,clearPercent,maxLever } = this.option ;

        Log('=============new===========');

        let account = await this.adapter.getAccount()
        let margin = account.margin_available;

        let price = await this.adapter.getPrice();
        let openOrders = await this.adapter.getProcessOrders();

        // 挂单多于1个
        if(openOrders.length >= 2){
            Log('clearn openOrders:',openOrders.length);
            await this.adapter.clearAllProcessOrders();
            return;
        }

        if(!this.initFlag){
            Log('---init---')
            await this.adapter.init();
            if(!this.unitValue)  this.unitValue = Math.floor( margin * baseUnit / (this.adapter.contract_size * price) );
            // if(!this.unitValue)  this.unitValue = Math.floor( margin * account.lever_rate / (this.adapter.contract_size * price) / unitN );
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
                await this.adapter.clearAllProcessOrders();
                return;
            }

            let ma = await this.adapter.getMa()
            let dirs = await this.adapter.getMaDir();
            dirs = dirs.map(e => { return e/price*100 });
            Log('ma:',ma,'dirs',dirs);

            // return;

            let isUp = dirs[0] > 0.05 && dirs[1] > 0.05;
            let isDown = dirs[0] < -0.05 && dirs[1] < -0.05;
            if ( direction.buy &&  price <= ma && (isUp || !isDown)) {
                Log('init buy',price);
                await this.adapter.openOrder(price, this.unitValue , 'buy', 'optimal_20_fok');
            }else if(direction.sell && price >= ma && (isDown || !isUp)){
                Log('init sell',price);
                await this.adapter.openOrder(price, this.unitValue, 'sell', 'optimal_20_fok');
            }

        }

        // return


        if (account.position.length > 0) {
            let pos = account.position[0];
            
            
            let holdValue = pos.cost_open;
            // Log(this.unitValue * this.adapter.contract_size*price,pos.profit)
            let profitPercent = Math.abs(pos.profit) / (this.unitValue * this.adapter.contract_size*price) * 100;
            Log('position:',pos.volume,'holdValue:',holdValue,'profit',pos.profit,'profitPercent',profitPercent);

            let value = getPercent(holdValue,price);
            // Log('value:',value);

            // 做空
            if (pos.direction == 'sell') {
                let isProfit = holdValue > price;
                Log('Sell:','profit',profit,'addPercent',addPercent,'addRatio',addRatio,'clearPercent',clearPercent,'value:',isProfit ? value : -1 * value,);
                // if (isProfit && value >= profit*0.4) {
                if (pos.volume > 0 && pos.frozen == 0) {
                    //盈利
                    // if(!openOrder || openOrder.offset !== 'close'){
                        let closePrice = holdValue - holdValue * profit * 0.01;
                        closePrice = precision(closePrice,this.precision);
                        Log('sell---close',value.toFixed(4),'closePrice',closePrice);
                        await this.adapter.closeOrder(closePrice,pos.volume, 'buy');
                    // }
                    // this.adapter.closeOrder(price,pos.volume, 'buy', 'optimal_20_fok');
                }

                if(!isProfit && profitPercent > clearPercent){
                    Log('sell-clear===========================');
                    if(pos.volume > 0 && pos.frozen > 0)  {
                        Log('clearAllProcessOrders');
                        await this.adapter.clearAllProcessOrders();
                    }
                    await this.adapter.closePostion(pos.volume,pos.direction === Code.BUY ? Code.SELL : Code.BUY );
                    return;
                }
                
                if(!isProfit && pos.volume /this.unitValue < maxLever  && value >= addPercent * 0.4  && availableUnit > pos.volume * 0.8) {
                    //负盈利
                    if(!openOrder || openOrder.offset !== 'open'){
                        let openPrice = holdValue + holdValue * addPercent * 0.01;
                        openPrice = precision(openPrice,this.precision);
                        Log('sell---add',value.toFixed(4),'openPrice',openPrice);
                        await this.adapter.openOrder(openPrice,Math.min(Math.round(pos.volume*addRatio),availableUnit), 'sell');
                    }
                    // this.adapter.openOrder(price,Math.min(pos.volume,availableUnit), 'sell', 'optimal_20_fok');
                } 
            }

            // 做多
            if (pos.direction == 'buy') {
                let isProfit = holdValue < price;
                Log('Buy:','profit',profit,'addPercent',addPercent,'addRatio',addRatio,'clearPercent',clearPercent,'value:',isProfit ? value : -1 * value,);

                // if (isProfit && value >= profit*0.4) {
                if (pos.volume > 0 && pos.frozen == 0) {
                    //盈利
                    // this.adapter.closeOrder(price,pos.volume, 'sell', 'optimal_20_fok');
                    // if(!openOrder || openOrder.offset !== 'close'){
                        let closePrice = holdValue + holdValue * profit * 0.01;
                        closePrice = precision(closePrice,this.precision);
                        Log('buy---close',value.toFixed(4),'closePrice',closePrice);
                        await this.adapter.closeOrder(closePrice,pos.volume, 'sell');

                    // }
                }

                if(!isProfit && profitPercent > clearPercent){
                    Log('buy-clear===========================');
                    if(pos.volume > 0 && pos.frozen > 0) {
                        Log('clearAllProcessOrders');
                        await this.adapter.clearAllProcessOrders();
                    }
                    await this.adapter.closePostion(pos.volume,pos.direction === Code.BUY ? Code.SELL : Code.BUY );
                    return;
                }
                
                if (!isProfit && pos.volume /this.unitValue < maxLever && value >= addPercent*0.4 && availableUnit > pos.volume * 0.8 ) {
                    //负盈利
                    if(!openOrder || openOrder.offset !== 'open'){
                        let openPrice = holdValue - holdValue * addPercent * 0.01;
                        openPrice = precision(openPrice,this.precision);
                        Log('buy---add',value.toFixed(4),'openPrice',openPrice);
                        await this.adapter.openOrder(openPrice,Math.min(Math.round(pos.volume*addRatio),availableUnit), 'buy');
                    }
                    // this.adapter.openOrder(price, Math.min(pos.volume,availableUnit), 'buy', 'optimal_20_fok');
                }
            }

            // if(
            //     (pos.volume > 0 && pos.frozen > 0)
            // ){
            //     Log('clear available-frozen info:',account.available,account.frozen);
            //     await this.adapter.clearAllProcessOrders();
            //     return;
            // }
        }

    }
}