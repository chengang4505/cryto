import axios from 'axios';

const timeout = 120000;

// 创建axios实例
const service = axios.create({
//   baseURL: 'http://192.168.105.140:8080', // api的base_url
    timeout: timeout, // 请求超时时间,
    headers: {}
})

// request拦截器
service.interceptors.request.use(config => {
    // config.headers['Authorization'] = getToken();

    return config
    // return Promise.reject('err')
}, error => {
    // Do something with request error
    console.error(error) // for debug
    return Promise.reject(error)
})

// respone拦截器
service.interceptors.response.use(
    response => {
        return response.data;
    },
    error => {
        return Promise.reject(error)
    }
)

// get
export function get(url, data = {}) {
    return service.get(url, { params: data});
}
// delete
export function del(url) {
    return service.delete(url,{ params: {test:1}});
}

// post
export function post(url, data = {}, contentType) {
    return service.post(url, data, {
        headers: {
            'Content-Type': contentType || 'application/json'// 'application/x-www-form-urlencoded'
        }
    });
}

// put
export function put(url, data = {}, contentType) {
    return service.put(url, data, {
        headers: {
            'Content-Type': contentType || 'application/json'// 'application/x-www-form-urlencoded'
        }
    });
}

export default service
