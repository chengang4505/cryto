import { v4 as uuid } from 'uuid';
import config from '../usdtPositive/config.js'

import USDTContract from '../usdtPositive/Trader.js'

const TraderMap = {
    'usdtcontract':USDTContract
}


export default class Manager{
    constructor(){
        this.robots = [];
        this.running = false;

        this.frameTime = 20;
        this.delayTime = 2;
    }

    async createRobot(name = 'usdtcontract'){

        let TraderClass = TraderMap[name];
        if(!TraderClass) return;

        let trader = new TraderClass(config);
        trader.id = uuid();
        this.robots.push(trader);

        await trader.init();
        console.log(`trader ${trader.id} init complete`)

        if(!this.running) this.run();

        return trader.id;
    }

    sleep(time = 0){
        return new Promise((resolve,reject) => {
            setTimeout(() => {
                resolve();
            },time)
        });
    }

    run(){
        if(this.running) return;
        this.running = true;
        console.log('start-------------------')

        let _run = async () => {

            if(this.robots.length === 0){
                this.running = false;
                console.log('stop-------------------')
                return;
            }

            console.log('frame-------------------')
            for(let i =0;i < this.robots.length;i++){
                let trader = this.robots[i];
                try{
                    await trader.run();
                    await this.sleep(1000 * this.delayTime);
                }catch(e){
                    // errN++;
                    trader.errors = trader.errors || [];
                    trader.errors.push(e);
                    // console.log(e)
                }
            }

            next(1000 * this.frameTime);
        }

        function next(time = 0){
            setTimeout(_run,time)
        }

        next();

    }
}
