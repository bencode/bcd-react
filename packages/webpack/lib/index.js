const pathUtil = require('path');
const fs = require('fs');
const resolveFrom = require('resolve-from');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


// refer https://github.com/facebook/create-react-app/blob/next/packages/react-scripts/config/webpack.config.prod.js


module.exports = function({
  env,
  srcPath, distPath,
  pagesPath, publicPath,
  shouldUseSourceMap,
  digest, extractCss
}) {
  env = env || process.env.NODE_ENV || 'development';
  srcPath = pathUtil.resolve(srcPath);
  distPath = pathUtil.resolve(distPath);
  pagesPath = pagesPath || pathUtil.join(srcPath, 'pages');

  return {
    mode: env,
    entry: getEntry(pagesPath),
    devtool: env === 'development' ? 'cheap-module-source-map'
      : shouldUseSourceMap ? 'source-map' : false,
    output: {
      path: distPath,
      filename: digest ? '[name].[chunkhash:8].js' : '[name].js',
      chunkFilename: '[name]-[chunkhash:8].chunk.js',
      publicPath: publicPath || '/'
    },
    module: {
      rules: getRules({ env, extractCss, shouldUseSourceMap })
    },
    plugins: getPlugins({ env, digest, srcPath, publicPath, extractCss }),
    optimization: env === 'development' ? {} : getOptimization({ shouldUseSourceMap }),
    resolve: {
      alias: getAlias(srcPath, { ignore: [pagesPath, publicPath] })
    }
  };
};


function getEntry(pagesPath) {
  const pages = fs.readdirSync(pagesPath).filter(name => (/^[-\w]+$/).test(name));
  return pages.reduce((acc, name) => {
    const path = pathUtil.join(pagesPath, name);
    if (resolve(path)) {
      acc[name] = path;
    }
    return acc;
  }, {});
}


function resolve(path) {
  try {
    return require.resolve(path);
  } catch (e) {
    return null;
  }
}


function getRules(opts) {
  return [
    {
      test: /\.css$/,
      use: getStyleLoader(opts)
    },
    {
      test: /\.scss$/,
      use: getStyleLoader({ ...opts, processor: 'sass-loader' })
    },
    {
      test: /\.less$/,
      use: getStyleLoader({ ...opts, processor: 'less-loader' })
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
      test: /\.jsx?$/,
      enforce: 'pre',
      exclude: [/[/\\\\]node_modules[/\\\\]/],
      use: [
        {
          loader: require.resolve('eslint-loader'),
          options: {
            eslintPath: require.resolve('eslint')
          }
        }
      ]
    },
    {
      test: /\.jsx?$/,
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
                regenerator: true
              }]
            ]
          }
        }
      ]
    }
  ];
}
//~ getRules


function getStyleLoader({ env, extractCss, processor, shouldUseSourceMap }) {
  const loaders = [
    extractCss ? MiniCssExtractPlugin.loader : require.resolve('style-loader'),
    require.resolve('css-loader'),
    {
      loader: require.resolve('postcss-loader'),
      options: {
        plugins: [
          require('autoprefixer')()
        ]
      }
    }
  ];
  if (processor) {
    loaders.push({
      loader: require.resolve(processor),
      options: {
        sourceMap: env === 'development' || shouldUseSourceMap
      }
    });
  }
  return loaders;
}

function getOptimization({ shouldUseSourceMap }) {
  return {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true
          }
        },
        parallel: true,
        cache: true,
        sourceMap: shouldUseSourceMap
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          parser: require('postcss-safe-parser'),
          discardComments: {
            removeAll: true
          }
        }
      })
    ]
    // splitChunks: {
    //   chunks: 'all',
    //   name: 'vendors',
    // },
    // runtimeChunk: true,
  };
}


function getPlugins({ env, digest, srcPath, publicPath, extractCss }) {
  const list = [];

  const templatePath = pathUtil.join(srcPath, 'template.html');
  if (fs.existsSync(templatePath)) {
    list.push(createHtmlPlugin({ env, templatePath }));
  }

  if (extractCss) {
    list.push(
      new MiniCssExtractPlugin({
        filename: digest ? '[name].[contenthash:8].css' : '[name].css',
        chunkFilename: '[name].[contenthash:8].chunk.css'
      })
    );
  }

  const publicDistPath = pathUtil.join(srcPath, 'public');
  if (fs.existsSync(publicDistPath)) {
    list.push(new CopyWebpackPlugin([{ from: publicDistPath }]));
  }

  if (env === 'production') {
    list.push(...getProdPlugins({ publicPath }));
  }

  return list;
}


function createHtmlPlugin({ env, templatePath }) {
  const opts = env === 'development' ? null : {
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    }
  };

  return new HtmlWebpackPlugin({
    inject: true,
    template: templatePath,
    ...opts
  });
}


function getProdPlugins({ publicPath }) {
  return [
    /** 定义一些环境变量 **/
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),

    new ManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: publicPath
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
    return fs.statSync(path).isDirectory()
      && !ignore.includes(path) && !resolveFrom.silent(relative, name);
  });
  return dirs.reduce((acc, name) => {
    acc[name] = pathUtil.join(srcPath, name);
    return acc;
  }, {});
}
