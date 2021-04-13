//用于开发环境配置
const base = require("./webpack.base.js"); //非src 旨在node模块
const { merge } = require("webpack-merge");
/* const path = require("path"); */
module.exports = merge(base, {
  mode: "development",
  devServer: {
    /*     contentBase: path.join(__dirname, "../dist"),
    compress: true, */
    port: 3000,
    open: true,
    hot: true,
    proxy:{
        "/api": { // 这是请求接口中要替换的标识
            target: "http://localhost:4000", // 被替换的目标地址，即把 /api 替换成这个
            // pathRewrite: {"^/api" : ""}, 
            secure: false, // 若代理的地址是https协议，需要配置这个属性
          },
    }
  },
});