//用于公用环境配置
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");

module.exports = {
  entry: path.resolve(__dirname, "../src/main.js"),
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "js/bundle.js",
    // publicPath: "./",
  },
  module: {
    rules: [
       { 
           test: /\.(woff|ttf|eot|svg)/, 
           loader: 'file-loader?name=font/[name].[ext]' 
      },
      {
        test: /\.js$/,
        exclude:/node_modules/,
        use:[{
            loader: 'babel-loader',
            }
        ]
        },
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ]
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, "../index.html") }),
    new VueLoaderPlugin(),
  ],
};