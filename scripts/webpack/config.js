const pathUtil = require('path');
const fs = require('fs');
const resolveFrom = require('resolve-from');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const debug = require('debug')('webpack/config');
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");


// refer https://github.com/facebook/create-react-app/blob/next/packages/react-scripts/config/webpack.config.prod.js


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
      test: /\.(jpe?g|png|gif|svg)$/i,
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
        require.resolve('thread-loader'),
        {
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            presets: [require.resolve('babel-preset-react-app')],
            plugins: [
              [
                // require.resolve('babel-plugin-named-asset-import'),
                {
                  loaderMap: {
                    svg: {
                      ReactComponent: 'svgr/webpack![path]',
                    },
                  },
                },
              ],
            ],
            compact: true,
            highlightCode: true,
          },
        },
      ]
    }
  ];
}
//~ getRules


function getPlugins({ publicPath }) {
  const list = [];

  // list.push(new MiniCssExtractPlugin({
  //   filename: '[name]-[chunkhash].css'
  // }));

  if (fs.existsSync(publicPath)) {
    list.push(new CopyWebpackPlugin([{ from: publicPath }]));
  }

  return list;
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
