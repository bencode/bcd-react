const pathUtil = require('path');
const fs = require('fs');
const resolveFrom = require('resolve-from');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const debug = require('debug')('webpack/config');
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");


module.exports = function({
  env,
  srcPath, distPath,
  pagesPath, publicPath
}) {
  pagesPath = pagesPath || pathUtil.join(srcPath, 'pages');
  publicPath = publicPath || pathUtil.join(srcPath, 'public');

  return {
    mode: env,
    entry: getEntry(pagesPath),
    output: {
      path: distPath,
      filename: '[name]-[hash].js',
      chunkFilename: '[id]-[chunkhash].js',
      publicPath: env === 'development' ? '/' : (publicPath || '/')
    },
    module: {
      rules: getRules(),
    },
    plugins: getPlugins({ publicPath }),
    resolve: {
      alias: getAlias(srcPath, { ignore: [pagesPath, publicPath] })
    }
  };
};


function getEntry(pagesPath) {
  const pages = fs.readdirSync(pagesPath).filter(name => (/^[-\w]+$/).test(name));
  return pages.reduce((acc, name) => {
    acc[name] = pathUtil.join(pagesPath, name);
    return acc;
  }, {});
}


function getRules() {
  return [
    {
      test: /\.(sa|sc|c)ss$/,
      use: [
        // MiniCssExtractPlugin.loader,
        'css-loader',
        {
          loader: 'postcss-loader',
          options: {
            plugins: [
              require('autoprefixer')()
            ]
          }
        },
        'sass-loader'
      ]
    },

    {
      test: /\.(jpe?g|png|gif)$/i,
      use: [
        'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
        // 'image-webpack-loader?{bypassOnDebug:true,options:{optimizationLevel:8},gifsicle:{interlaced:false}}'
      ]
    },

    {
      test: /\.(woff|woff2|eot|ttf)$/,
      loader: 'url-loader?limit=8192'
    },

    {
      test: /\.svg$/,
      use: 'file-loader'
    },

    {
      test: /\.js$/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { browsers: '> 1%, last 2 versions' }
              }],
              'react'
            ],
            plugins: [
              'transform-class-properties',
              '@babel/plugin-syntax-dynamic-import',
              ['@babel/plugin-transform-runtime', {
                corejs: false,
                helpers: false,
                regenerator: true,
              }]
            ]
          }
        }
      ]
    }
  ];
}
//~ getRules


function getPlugins({ publicPath }) {
  return [
    // new MiniCssExtractPlugin({
    //   filename: '[name]-[chunkhash].css'
    // }),

    new CopyWebpackPlugin([{
      from: publicPath
    }])
  ];
}


function getAlias(srcPath, { ignore }) {
  const relative = pathUtil.join(srcPath, '..');
  const dirs = fs.readdirSync(srcPath).filter(name => {
    const path = pathUtil.join(srcPath, name);
    return fs.statSync(path).isDirectory() &&
      !ignore.includes(path) && !resolveFrom.slice(relative, name);
  });
  return dirs.reduce((acc, name) => {
    acc[name] = pathUtil.join(srcPath, name);
    return acc;
  }, {});
}
