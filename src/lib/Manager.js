import { v4 as uuid } from 'uuid';
import Trader from '../usdtPositive/Trader.js'
import config from '../usdtPositive/config.js'


class Manager{
    constructor(){
        this.robots = [];
    }

    async createRobot(){
        let trader = new Trader(config);
        trader.id = uuid();
        this.robots.push(trader);

        await trader.init();
    }

    run(){

        next();

        function next(time = 0){
            setTimeout(_run,time)
        }

        let robots = this.robots;
        async function _run(){
            for(let i =0;i< robots.length;i++){
                let trader = robots[i];
                try{
                    await trader.run();
                }catch(e){
                    // errN++;
                    trader.errors = trader.errors || [];
                    trader.errors.push(e);
                    // console.log(e)
                }
            }

            next(1000 * 20);
        }

    }
}

let manager = new Manager();

manager.createRobot();

export default manager