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
            symbol
        } = option;
        this.option = option;
        this.symbol = symbol;
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

        if(!this.initFlag){
            Log('---init---')
            await this.adapter.init();
            this.unitValue = Math.floor( margin * account.lever_rate / (this.adapter.contract_size * price) / unitN );
            this.initFlag = true;
            Log('init unit',this.unitValue);
        }

        let availableUnit = Math.floor(margin * account.lever_rate / (this.adapter.contract_size * price));
        Log('getPrice:',price);
        Log('margin:',margin,'availableUnit',availableUnit);


        if(account.position.length === 0){
            let ma = await this.adapter.getMa()
            Log('ma:',ma);

            if ( price >= ma) {
                Log('sell');
                // exchange.SetDirection("sell")
                // exchange.Sell(-1, unitValue, "开空")
                this.adapter.openOrder(price, this.unitValue, 'sell', 'optimal_20_fok');
            }else {
                Log('buy');
                // exchange.SetDirection("buy")
                // exchange.Buy(-1, unitValue, "开多")
                this.adapter.openOrder(price, this.unitValue , 'buy', 'optimal_20_fok');
            }

        }

        // return


        if (account.position.length > 0) {
            let pos = account.position[0];
            Log('position:',pos.volume);


            let holdValue = pos.cost_open;
            Log('holdValue:',holdValue);

            let value = getPercent(holdValue,price);

            // Log('value:',value);

            // 做空
            if (pos.direction == 'sell') {
                Log('Sell:','profit',profit,'addPercent',addPercent,'value:',holdValue > price ? value : -1 * value,);

                //盈利大于期望 
                if (holdValue > price && value >= profit) {
                    // Log('value',value)
                    Log('sell---close',value);
                    // exchange.SetDirection("closesell")
                    // exchange.Buy(-1, pos.Amount)
                    this.adapter.closeOrder(price,pos.volume, 'buy', 'optimal_20_fok');
                }
                //负盈利大于保证金 则加仓

                if (holdValue < price && value >= addPercent  && availableUnit > 1) {
                    Log('sell---add',value);
                    this.adapter.openOrder(price,Math.min(pos.volume,availableUnit), 'sell', 'optimal_20_fok');
                    // exchange.SetDirection("sell")
                    // exchange.Sell(-1, pos.Amount)
                }
            }

            // 做多
            if (pos.direction == 'buy') {

                Log('Buy:','profit',profit,'addPercent',addPercent,'value:',holdValue < price ? value : -1 * value,);

                if (holdValue < price && value >= profit) {
                    Log('buy---close',value);
                    this.adapter.closeOrder(price,pos.volume, 'sell', 'optimal_20_fok');
                    // exchange.SetDirection("closebuy")
                    // exchange.Sell(-1, pos.Amount)
                }

                if (holdValue > price && value >= addPercent && availableUnit > 1 ) {
                    Log('buy---add',value);
                    this.adapter.openOrder(price, Math.min(pos.volume,availableUnit), 'buy', 'optimal_20_fok');
                    // exchange.SetDirection("buy")
                    // exchange.Buy(-1, pos.Amount)
                }
            }
        }

    }
}