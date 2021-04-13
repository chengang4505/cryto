import { get, post, del } from './base'

export function rawcall(data){
    let url = '/api/rawcall';
    return post(url,data);
}

export function getRobots(){
    let url = '/api/robots';
    return get(url);
}

// export function