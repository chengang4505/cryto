import { Code } from '../lib/const.js'


let accessKey = '6f355162-d0649c48-f23e8167-ez2xc4vb6n';
let secretKey = 'ca63f40b-cee83f36-731994cc-af770';


// 主账户
// let accessKey = '9b55a7eb-ab320c31-042196ff-dqnh6tvdf3';
// let secretKey = '17053d8b-04ee85b6-d3ed9a22-5e2c2';


let config = {
    symbol : 'ETH',
    lever_rate : 20,
    profit : 0.3,
    addPercent : 1.5,
    addRatio:1.5,
    baseUnit:1,
    clearPercent:0.5,
    maxLever:0.5,
    unitN:100,
    direction:{
        sell:true,
        buy:true,
    },
    // unitValue:31,
}


config.keyConfig = {accessKey,secretKey};


export default config

export const keyConfig = {accessKey,secretKey};
