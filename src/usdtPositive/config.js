import { Code } from '../lib/const.js'


let accessKey = '6f355162-d0649c48-f23e8167-ez2xc4vb6n';
let secretKey = 'ca63f40b-cee83f36-731994cc-af770';



let config = {
    symbol : 'XRP',
    direction : Code.BUY,
    lever_rate : 5,
    openPercentOffset : 1.5,
    closePercentOffset : 1,
    minClosePercent : 1.8,
    openMaxN : 3,
    closeMaxN : 5,
    unitValue: 10,
    highPrice: 200,
    lowPrice: 150,
    // option
    openOffset : 0,
    winPrice: -1,
    losePrice: -1,
    openMAConfig : {type : [5,10,20,30],period : '5min'},
    // openMAConfig : null,
    openThreshold: 1000000,
    positionPrice: 1000000,
    
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
