import Trader from './Trader.js'
import config from './config.js'


// console.log(ex)


var trader = new Trader(config);

start();

async function start(){
    await trader.init();
    console.log('init complete')
    console.log('trader:',trader.symbol,trader.direction)


    next();
    // test();

    function next(time = 0){
        setTimeout(run,time)
    }

    let errN = 0;
    async function run(){
        try{
            await trader.run();
        }catch(e){
            errN++;
            console.log(e)
        }
        next(1000 * 30);
    }
}


// let ex = new Adapter(config.symbol,{accessKey:config.accessKey,secretKey:config.secretKey},config.direction);
// var ex = new Adapter('BTC',{accessKey,secretKey});
async function test(){
    let ex = trader.adapter;
    // console.log(ex);
    // console.log(ex.accountInfo);
    try{
    // 829004087122235392 828755543047880706
    // console.log(await ex.openOrder(59000,30));
    // console.log(await ex.closeOrder(154,1));
    // console.log(await ex.cancelOrder(['829004709414567936']));
    // console.log(await ex.getAccount());
    //828758343987728384
    // console.log(await ex.getOrderInfo(['829004087122235392','829004492837896193','829004709414567936']));
    // console.log((await ex.getProcessOrders()));
    // console.log(await ex.clearAllProcessOrders());
    // console.log(await ex.closePostion(6));
    // console.log(await ex.getPrice());
    // ex.getMa();
    // await ex.clear();




    }catch(e){
        console.log(e)
    }
}

