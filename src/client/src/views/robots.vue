<template>
  <div class="robot-info">
      <div class="robot-list"></div>
      <Info :symbols="symbols"/>
  </div>
</template>
<script>
import * as api from '../api/index.js'
import Info from './sub/info.vue'

export default {
    components:{
        Info
    },
    data(){
    window.test = this;

        return {
            symbols:[],
        }
    },
    mounted(){
        // this.getRobots();
        // api.rawcall({
        //     method:'post',
        //     url:'/linear-swap-api/v1/swap_cross_position_info',
        //     encrypt:true,
        //     data:{

        //     }
        // });
        
        api.rawcall({
            method:'get',
            url:'/linear-swap-api/v1/swap_contract_info',
            encrypt:false,
            data:{
            //    contract_code:'BTC-USDT' 
            }
        });

        this.getSymbolsInfo();
    },
    methods:{
        getSymbolsInfo(){
            api.rawcall({
                method:'get',
                url:'/linear-swap-api/v1/swap_contract_info',
                encrypt:false,
                data:{
                //    contract_code:'BTC-USDT' 
                }
            }).then(data => {
                let info = data.data.map(e => {
                    return { symbol:e.symbol,contract_size:e.contract_size }
                });
                this.symbols = info;
            });
        },
        getRobots(){
            api.getRobots();
        }
    }
};
</script>
<style lang="less">
.robot-info{
    height: 100%;
    position: relative;
    .robot-list{
        min-height: 160px;
        border: 1px solid #ccc;
        // margin-right: 500px;
    }

    .info{
            // width: 500px;
            // float: right;
            // top: 0px;
            // position: absolute;
            // right: 0px;
            // padding: 4px;
        
    }

    .el-form-item{
        margin-bottom: 2px;
    }
    .el-form-item__content{
        line-height: 30px;
    }

    .el-form-item__label{
        line-height: 30px;
    }
}
</style>