const path = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");


module.exports = function (err) {
  if (err) {
    console.log('err:', err);
    return;
  }

  const NODE_ENV = process.env.NODE_ENV;

  const prod = NODE_ENV === 'production';
  
  let webpackConfig = {
    mode: NODE_ENV,
    entry: './src/index.js',
    output: {
      path: path.join(__dirname, 'dist'),
      filename: `[name].js?hash=[hash:8]`,
      chunkFilename: `[name]_[hash].js`,
    },
    devtool: prod ? false : 'source-map',
    watchOptions: {
      ignored: /node_modules/,
    },
    devServer: {
      hot: true,
      open: true,
    },
    resolve: {
      // alias: {
      //   components: '/src/components',
      // },
      extensions: ['.js', '.jsx'],
      modules: [path.resolve(__dirname, 'node_modules')],
      // 因为使用webpack4的tree shaking功能了，所以针对npm的第三方模块，优先使用es6模块语法
      mainFields: ['jsnext:main', 'browser', 'main'],
    },
    module: {
      rules: [
        {
          test: [
            /\.jsx?$/,
          ],
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                [
                  '@babel/preset-env',
                  // {
                  //   modules: false, // 保留es6模块化的语句，为了tree shaking
                  // },
                ],
                [
                  '@babel/preset-react',
                ]
              ],
              plugins: [
                ["@babel/plugin-proposal-decorators", { "legacy": true }],
                ["@babel/plugin-proposal-class-properties", { "loose": true }],
                [
                  '@babel/plugin-transform-runtime',
                  {
                    "corejs": 2
                  }
                ],
              ]
            },
          },
          include: path.resolve(__dirname, 'src'),
        },
        {
          test: [
            /\.css$/,
            /\.less$/,
          ],
          exclude: /node_modules/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'style-loader',
              options: {
                singleton: true,
              }
            },
            {
              loader: 'css-loader',
              options: {
                modules: false,
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: [
                  require('postcss-preset-env')(),
                  require('precss')(),
                  require('postcss-cssnext')(),
                ]
              }
            },
          ],
        }
      ]
    },
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true // set to true if you want JS source maps
        }),
        new OptimizeCSSAssetsPlugin({})
      ]
    },
    plugins: [
      new HotModuleReplacementPlugin(),
      // 缓存插件，提升性能
      new HardSourceWebpackPlugin(),
      new htmlWebpackPlugin({
        title: 'immer-tutorial',
        env: NODE_ENV,
        filename: 'index.html',
        template: './entry.ejs',
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilname: '[id].css',
      })
    ]
  }


  if (prod) {
    webpackConfig.plugins.push(
      new CopyWebpackPlugin([
        {
          from: 'assets',
          to: path.resolve(webpackConfig.output.path, 'assets'),
        },
      ])
    )
  }

  return webpackConfig
}
