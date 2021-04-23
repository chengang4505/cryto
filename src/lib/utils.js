
export function precision(num,p = 1){
    // return _N(num,p);
    return +(num.toFixed(p))
}

export function getPrecision(num){
    let v = num * 0.0001;
    let n = 0;
    while(v < 1){
        n++;
        v *= 10;
    }
    return n;
}