<template>
 <div class="info">
        <el-form :model="form" ref="form" label-width="220px">
            <el-form-item label="币种" :rules="[required]" prop="symbol">
                <el-select size="mini" v-model="form.symbol" placeholder="请选择">
                    <el-option v-for="item in symbols" :key="item.symbol" :label="item.symbol" :value="item.symbol"> </el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="方向" :rules="[required]" prop="direction">
                <el-select size="mini" v-model="form.direction" placeholder="请选择">
                    <el-option label="buy" value="buy"> </el-option>
                    <el-option label="sell" value="sell"> </el-option>
                </el-select>
            </el-form-item>
            <el-form-item v-for="item in attrList" :key="item.name" :label="item.label" :prop="item.name" :rules="[required]">
                <el-input-number style="width:160px;" size="mini" v-model="form[item.name]"></el-input-number>
            </el-form-item>
            <el-form-item label="MA配置">
                <el-checkbox size="mini" v-model="form.maEnable"></el-checkbox>
            </el-form-item>
            <el-form-item label="MA数值">
                 <el-select size="mini" multiple v-model="form.maType" placeholder="请选择">
                    <el-option v-for="item in maTypes" :key="item.value" :label="item.value" :value="item.value"> </el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="MA周期">
                 <el-select size="mini" v-model="form.maPerid" placeholder="请选择">
                    <el-option v-for="item in maPerids" :key="item.value" :label="item.value" :value="item.value"> </el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <div style="text-align: center;">
            <el-button size="mini" style="width:100px" @click="onCreate">创建</el-button>
            <el-button size="mini" style="width:100px">更新</el-button>
        </div>
 </div>
</template>
<script>
import * as api from '../../api/index.js'

// base
let defaultValue = {};
let config = [
    {name:'openPercentOffset',label:'开单网格间隔',value:1},
    {name:'closePercentOffset',label:'平单网格间隔',value:1},
    {name:'minClosePercent',label:'最小平单利润比',value:0.9},
    {name:'unitValue',label:'单个网格开单值(张)',value:1},
    {name:'highPrice',label:'网格区间上限',value:200},
    {name:'lowPrice',label:'网格区间下限',value:150},
    {name:'openMaxN',label:'最大开单挂单数',value:3},
    {name:'closeMaxN',label:'最大平单挂单数',value:5},
    {name:'openThreshold',label:'开单阀值',value:1000000},
    {name:'positionPrice',label:'持仓成本',value:1000000},
]
config.forEach(e => { defaultValue[e.name] = e.value });

export default {
    props:{
        symbols:{ type:Array, default: () => [] }
    },
    data(){
        let required = { required: true, message: '不能为空', trigger: 'blur' };

        return {
            required,
            // 
            attrList:[
                ...config,
                // {name:'positionPrice',label:'持仓成本',value:1000000},
            ],
            form:{
                symbol:'BTC',
                direction:'buy',
                ...defaultValue,
                maEnable:false,
                maType:[5],
                maPerid:'5min',
            },
            maTypes:[
                {value:5},
                {value:10},
                {value:20},
                {value:30},
            ],
            maPerids:[
                {value:'5min'},
                {value:'10min'},
                {value:'15min'},
                {value:'30min'},
            ]
        }
    },
    mounted(){
        
    },
    methods:{
        onCreate(){
            this.$refs.form.validate(valid => {
                if(valid){
                    let config = {};
                    this.attrList.forEach(e => {
                        config[e.name] = this.form[e.name];
                    });
                    config.symbol = this.form.symbol;
                    config.direction = this.form.direction;
                    config.openMAConfig = null;
                    if(this.form.maEnable){
                        config.openMAConfig = {type : [5,10,20,30],period : '5min'};
                    }

                    console.log(config);
                }
            });
        },
    }
};
</script>
<style lang="less">
</style>