//用于生产环境配置
const base = require("./webpack.base.js");
const merge = require("webpack-merge");
module.exports = merge(base, {
  mode: "production",
});