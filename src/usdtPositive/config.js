import { Code } from '../lib/const.js'


let accessKey = '6f355162-d0649c48-f23e8167-ez2xc4vb6n';
let secretKey = 'ca63f40b-cee83f36-731994cc-af770';


// 主账户
// let accessKey = '9b55a7eb-ab320c31-042196ff-dqnh6tvdf3';
// let secretKey = '17053d8b-04ee85b6-d3ed9a22-5e2c2';


let config = {
    symbol : 'ETH',
    direction : Code.SELL,
    lever_rate : 5,
    openPercentOffset : 0.5,
    closePercentOffset : 0.5,
    minClosePercent : 0.9,
    openMaxN : 3,
    closeMaxN : 5,
    unitValue: 80,
    highPrice: 2500,
    lowPrice: 2000,
    // option
    openOffset : 0,
    winPrice: -1,
    losePrice: -1,
    openMAConfig : {type : [20],period : '5min'},
    // openMAConfig : null,
    openThreshold: 1000000,
    positionPrice: 1.8,
    
}

config.keyConfig = {accessKey,secretKey};

if(config.direction === Code.BUY){
    config.openThreshold = 1000000;
    config.positionPrice = 1000000;
} else {
    config.openThreshold = -1000000;
    config.positionPrice = -1000000;
}

export default config

export const keyConfig = {accessKey,secretKey};
