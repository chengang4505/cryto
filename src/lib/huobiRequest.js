import  axios from 'axios';
import moment from 'moment';
import * as CryptoJSLib from 'crypto-js';
// var CryptoJS = require("crypto-js");
// import * as HmacSHA256 from 'crypto-js/hmac-sha256';
let CryptoJS = CryptoJSLib.default;
let HmacSHA256 = CryptoJS.HmacSHA256;

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json;charset=utf-8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36'
};

// const DEFAULT_HEADERS = {
//     // 'Content-Type': 'application/json;charset=utf-8',
//     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
//     // 'User-Agent': 'PostmanRuntime/7.26.8',
//     // 'Connection': 'keep-alive',
//     'cookie': '__cfduid=d65d6c2c50b226d6e7378fb86aa9bde571616850328; OUTFOX_SEARCH_USER_ID_NCOO=1621785148.736253',
//     'cache-control':'no-cache',
//     'accept-encoding':'gzip, deflate, br',
//     // 'Accept-Encoding': 'gzip, deflate, br',
//   };

let STATUS =  {
  'OK' : 'ok',
  'ERROR' : 'error'
}

/**
 * 火币API调用
 *
 * - accessKey: 必填, 通过火币官方申请 https://huobiapi.github.io/docs/spot/v1/cn/#185368440e
 * - secretKey: 必填, 通过火币官方申请 https://huobiapi.github.io/docs/spot/v1/cn/#185368440e
 * - proxy: 选填, 需要代理时填入, default false
 * - hostname: 选填, 调用火币的hostname, default 'api.huobi.pro'
 * - timeout: 选填, 接口调用超时时间, 单位ms, default 30000
 * 
 * @export
 * @class HuobiRestAPI
 */
export default class HuobiRestAPI {
//   private accessKey: string;
//   private secretKey: string;
//   private httpsConfig: Object;

//   hostname: string;
//   protocol: string;
//   proxy: {
//     host: string,
//     port: number
//   } | false;

// api.btcgateway.pro
// api.huobi.pro
  constructor({ accessKey, secretKey, proxy = false, hostname = 'api.huobi.pro', timeout = 30000 }) {

    if (!accessKey || !secretKey) {
        throw 'Params Missing: accessKey or secretKey';
    }

    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.hostname = hostname;
    this.protocol = 'https';
    this.proxy = proxy;

    this.httpClient = axios.create({
        timeout: timeout,
        headers: DEFAULT_HEADERS
      });
    this.httpClient.defaults.timeout = timeout;

    // this.httpsConfig = {
    //   timeout,
    //   headers: DEFAULT_HEADERS
    // };
  }

  get host() {
    return `${this.protocol}://${this.hostname}`;
  }

  get(path, params) {
    return this.request('GET', path, params);
  }

  post(path, params) {
    return this.request('POST', path, params);
  }

  request(method, path, params) {
    if (method !== 'GET' && method !== 'POST') {
      throw 'method only be GET or POST';
    }

    path = this.foramtPath(path);

    const { paramsStr, originalParams } = this.signParams({
      path,
      method,
      params
    });

    if (method === 'GET') {
      return this.fetch(`${path}?${paramsStr}`, {
        method
      });
    }

    return this.fetch(`${path}?${paramsStr}`, {
      method,
      data: originalParams
    });
  }

  signParams({
    method, path, params
  }) {
    if (!path.startsWith('/')) {
      throw 'path must starts with \\/';
    }

    const needSignature = !path.startsWith('/market');

    let originalParams;
    if (needSignature) {
      originalParams = {
        AccessKeyId: this.accessKey,
        SignatureMethod: 'HmacSHA256',
        SignatureVersion: '2',
        Timestamp: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
        ...params
      };
    } else {
      originalParams = { ...params };
    }

    const paramsArr = [];
    for (const item in originalParams) {
      paramsArr.push(`${item}=${encodeURIComponent(originalParams[item])}`);
    }
    const pStr = paramsArr.sort().join('&');

    if (!needSignature) {
      return {
        originalParams,
        signature: '',
        paramsStr: pStr
      };
    }

    const meta = [method, this.hostname, path, pStr].join('\n');
    const hash = HmacSHA256(meta, this.secretKey);
    const signature = encodeURIComponent(CryptoJS.enc.Base64.stringify(hash));

    return {
      signature,
      originalParams,
      paramsStr: `${pStr}&Signature=${signature}`
    };
  }

foramtPath(path) {
    path = path.trim();
    if (!path.startsWith('/')) {
      path = `/${ path }`;
    }
    if (path.endsWith('/')) {
      path = path.substring(0, path.length - 1);
    }
    return path;
  }

   fetch(path, options) {
    const url = `${this.host}${path}`;
    // console.log(url);
    return this.httpClient({
      url,
      ...options,
    //   ...this.httpsConfig,
      proxy: this.proxy
    }).then((res) => {
        // console.log(res.data)
      if (res.data.status !== 'ok') {
          throw res.data;
      }
      return res.data;
    })
    // .then((data) => {
    //   const status = data.status.toLowerCase();
    //   if (status !== STATUS.OK) {
    //       throw data;
    //   }
    //   return data;
    // });
  }
}

// module.exports.HuobiRestAPI = HuobiRestAPI;

