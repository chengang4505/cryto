import Adapter from './adapter.js'
import Trader from './Trader.js'

let accessKey = '6f355162-d0649c48-f23e8167-ez2xc4vb6n';
let secretKey = 'ca63f40b-cee83f36-731994cc-af770';

var ex = new Adapter('ETH',{accessKey,secretKey});
// var ex = new Adapter('BTC',{accessKey,secretKey});

ex.init(async () => {
    console.log('init complete')
    // console.log(ex)
    let config = {
        openPercentOffset : 1,
        closePercentOffset : 1,
        minClosePercent : 0.5,
        openMaxN : 3,
        closeMaxN : 5,
        unitValue: 10,
        highPrice: 2300,
        lowPrice: 1800,
        // option
        openOffset : 0,
        winPrice: -1,
        losePrice: -1,
        // openMAConfig : {type : 5,period : '5min'},
        openThreshold: 1000000,
        positionPrice: 10000000,
    }
    var trader = new Trader(config,ex,'buy');

    // console.log(trader)

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
});

async function test(){
    console.log(ex.accountInfo);
    try{
    // 829004087122235392 828755543047880706
    // console.log(await ex.openOrder(2070,30));
    // console.log(await ex.closeOrder(154,1));
    // console.log(await ex.cancelOrder(['829004709414567936']));
    // console.log(await ex.getAccount());
    //828758343987728384
    // console.log(await ex.getOrderInfo(['829004087122235392','829004492837896193','829004709414567936']));
    // console.log((await ex.getProcessOrders()));
    // console.log(await ex.clearAllProcessOrders());
    // console.log(await ex.closePostion(1));
    // console.log(await ex.getPrice());
    // ex.getMa();
    // await ex.clear();




    }catch(e){
        console.log(e)
    }
}

