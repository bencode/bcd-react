const pathUtil = require('path');
const fs = require('fs');
const resolveFrom = require('resolve-from');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const debug = require('debug')('webpack/config');
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");


// refer https://github.com/facebook/create-react-app/blob/next/packages/react-scripts/config/webpack.config.prod.js


module.exports = function({
  env,
  srcPath, distPath,
  pagesPath, publicPath,
  shouldUseSourceMap
}) {
  srcPath = pathUtil.resolve(srcPath);
  distPath = pathUtil.resolve(distPath);
  pagesPath = pagesPath || pathUtil.join(srcPath, 'pages');
  publicPath = publicPath || pathUtil.join(srcPath, 'public');

  return {
    mode: env,
    entry: getEntry(pagesPath),
    devtool: env === 'development' ? 'cheap-module-source-map' :
      shouldUseSourceMap ? 'source-map' : false,
    output: {
      path: distPath,
      filename: '[name].js',
      chunkFilename: '[id]-[chunkhash].js',
      publicPath: publicPath || '/'
    },
    module: {
      rules: getRules(),
    },
    plugins: getPlugins({ env, publicPath }),
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
        require.resolve('style-loader'),
        require.resolve('css-loader'),
        {
          loader: require.resolve('postcss-loader'),
          options: {
            plugins: [
              require('autoprefixer')()
            ]
          }
        },
        require.resolve('sass-loader')
      ]
    },

    {
      test: /\.(jpe?g|png|gif)$/i,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            name: '[name].[hash:8].[ext]'
          }
        }
      ]
    },

    {
      test: /\.js$/,
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [
              [require.resolve('@babel/preset-env'), {
                targets: { browsers: '> 1%, last 2 versions' }
              }],
              require.resolve('@babel/preset-react')
            ],
            plugins: [
              require.resolve('babel-plugin-transform-class-properties'),
              require.resolve('@babel/plugin-syntax-dynamic-import'),
              [require.resolve('@babel/plugin-transform-runtime'), {
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


function getPlugins({ env, publicPath }) {
  const list = [];

  // list.push(new MiniCssExtractPlugin({
  //   filename: '[name]-[chunkhash].css'
  // }));

  if (fs.existsSync(publicPath)) {
    list.push(new CopyWebpackPlugin([{ from: publicPath }]));
  }

  if (env === 'production') {
    list.push(...getProdPlugins({ publicPath }));
  }

  return list;
}


function getProdPlugins({ publicPath }) {
  return [
    /** 定义一些环境变量 **/
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),

    new ManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: publicPath,
    }),

    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

    /** 统计打包后的模块构成 **/
    new BundleAnalyzerPlugin({ analyzerMode: 'static' })
  ];
}


function getAlias(srcPath, { ignore }) {
  const relative = pathUtil.join(srcPath, '..');
  const dirs = fs.readdirSync(srcPath).filter(name => {
    const path = pathUtil.join(srcPath, name);
    return fs.statSync(path).isDirectory() &&
      !ignore.includes(path) && !resolveFrom.silent(relative, name);
  });
  return dirs.reduce((acc, name) => {
    acc[name] = pathUtil.join(srcPath, name);
    return acc;
  }, {});
}
