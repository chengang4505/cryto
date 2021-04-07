import Adapter from './adapter.js'
import Trader from './Trader.js'

let accessKey = '6f355162-d0649c48-f23e8167-ez2xc4vb6n';
let secretKey = 'ca63f40b-cee83f36-731994cc-af770';

var ex = new Adapter(undefined,{accessKey,secretKey});
// var ex = new Adapter('BTC',{accessKey,secretKey});

ex.init(async () => {
    console.log('init complete')
    // console.log(ex)
    var trader = new Trader({},ex);

    // next();
    test();

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
        next(1000 * 20);
    }
});

async function test(){
    try{
    // 829004087122235392 828755543047880706
    // console.log(await ex.openOrder(57900,1));
    // console.log(await ex.closeOrder(58488,3));
    // console.log(await ex.cancelOrder(['829004709414567936']));
    // console.log(await ex.getAccount());
    //828758343987728384
    // console.log(await ex.getOrderInfo(['829004087122235392','829004492837896193','829004709414567936']));
    // console.log((await ex.getProcessOrders()));
    // console.log(await ex.clearAllProcessOrders());
    // console.log(await ex.closePostion(1));
    // console.log(await ex.getPrice());
    // ex.getMa();
    await ex.clear();




    }catch(e){
        console.log(e)
    }
}

