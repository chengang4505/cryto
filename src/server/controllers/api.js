import express from 'express'
import HuobiRequest from '../../lib/huobiRequest.js'
import manager from '../manager.js'
import { keyConfig } from '../../usdtPositive/config.js'

var usdtConstractAPI = express.Router();

const { accessKey,secretKey } = keyConfig;
const huobiHbdmAPI = new HuobiRequest({accessKey, secretKey,hostname:'api.hbdm.com'});

function OK(data){ return {status:'ok',data}}
function ERR(data){ return {status:'error',data}}

usdtConstractAPI.post('/rawcall', async function(req, res){
    let {
        method = 'get',
        encrypt = true,
        url = '',
        data = {}
    } = req.body;

    if(!url) return res.json(ERR());

    let request;
    if(encrypt){
        if(method === 'get') request = huobiHbdmAPI.get(url,data);
        else request = huobiHbdmAPI.post(url,data);

    }else {
        request = huobiHbdmAPI.fetch(url,{
            method: method.toUpperCase(),
            params: data
        })
    }

    request.then(data => {
        res.json(data);
    }).catch(e => {
        res.json(e);
    })
})

usdtConstractAPI.get('/robots', async function(req, res) {
    let data = manager.robots.map(e => {
        return {}
    });
    res.json(OK(data));
});


usdtConstractAPI.post('/robot', async function(req, res) {
    if(manager.robots.length >= 1){
        res.json(ERR('当前支持一个robot'));
        return;
    }

    let id;
    try{
        id = await manager.createRobot();
    } catch(e){
        res.json(ERR(e));
        return;
    }

    if(!id){
        res.json(ERR('创建失败'));
        return;
    }

    res.json(OK(id));
})

usdtConstractAPI.delete('/robot/:id', function(req, res) {
    // console.log(req.params)
    let id = req.params.id;
    let finds = manager.robots.filter(e => (e.id === id ));

    if(finds.length === 0){
        res.json(ERR('不存在该robot'));
        return;
    }

    let robot = finds[0];
    try{
        robot.clear();
    }catch(e){
        res.json(ERR(e));
        return;
    }

    manager.robots = manager.robots.filter(e => (e.id !== robot.id));
    res.json(OK('操作成功'));
})


export default usdtConstractAPI;