const pathUtil = require('path');
const fs = require('fs');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


// refer https://github.com/facebook/create-react-app/blob/next/packages/react-scripts/config/webpack.config.prod.js

/* eslint object-property-newline: 0 */


module.exports = function({
  env,
  srcPath, distPath, assetsDir,
  pagesPath, publicPath,
  entry,
  shouldUseSourceMap,
  digest, extractCss = true, manifestFileName,
  htmlWebpackPlugin,
  swPrecache,
  ...extra
} = {}) {
  env = env || process.env.NODE_ENV || 'development';
  srcPath = pathUtil.resolve(srcPath || 'src');
  distPath = pathUtil.resolve(distPath || 'dist');
  assetsDir = ensureAssetsDir(assetsDir);
  pagesPath = pagesPath || pathUtil.join(srcPath, 'pages');
  digest = digest === undefined ? env !== 'development' : digest;

  entry = entry || getEntry(pagesPath);

  const config = {
    devServer: createDevServerConfig({ distPath }),
    mode: env,
    bail: true,
    entry,
    devtool: env === 'development' ? 'cheap-module-source-map' :
      shouldUseSourceMap ? 'source-map' : false,
    output: {
      path: distPath,
      filename: digest ? `${assetsDir.js}[name].[chunkhash:8].js` : `${assetsDir.js}[name].js`,
      chunkFilename: `${assetsDir.js}[name]-[chunkhash:8].chunk.js`,
      publicPath: publicPath || '/'
    },
    module: {
      rules: getRules({ env, extractCss, assetsDir, shouldUseSourceMap })
    },
    plugins: getPlugins({
      env, digest, srcPath, publicPath, assetsDir,
      extractCss, entry, htmlWebpackPlugin, manifestFileName,
      swPrecache
    }),
    optimization: getOptimization({ env, shouldUseSourceMap }),
    resolve: {
      alias: { '@': srcPath }
    }
  };

  return extra ? merge(config, extra) : config;
};


function ensureAssetsDir(assetsDir) {
  if (typeof assetsDir === 'string') {
    return { js: assetsDir, css: assetsDir, media: assetsDir };
  }
  if (!assetsDir) {
    return { js: 'js/', css: 'css/', media: 'media/' };
  }
  return {
    js: assetsDir.js || 'js/',
    css: assetsDir.css || 'css/',
    media: assetsDir.media || 'media/'
  };
}


function createDevServerConfig() {
  return {
    host: '0.0.0.0',
    disableHostCheck: true,
    proxy: {
      '/*': {
        bypass: req => {
          if (req.headers.accept.indexOf('html') !== -1) {
            return '/index.html';
          }
          return null;
        }
      }
    }
  };
}


function getEntry(pagesPath) {
  if (!fs.existsSync(pagesPath)) {
    return {};
  }

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
            name: `${opts.assetsDir.media}[name].[hash:8].[ext]`
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

function getOptimization({ env, shouldUseSourceMap }) {
  return {
    splitChunks: {
      chunks: 'async',
      name: 'vendors',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3
    },
    // runtimeChunk: true,

    minimizer: env === 'development' ? [] : [
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
  };
}


function getPlugins({
  env, digest, srcPath, publicPath, extractCss,
  assetsDir, entry, htmlWebpackPlugin, manifestFileName,
  swPrecache
}) {
  const list = [];

  if (htmlWebpackPlugin !== false) {
    const items = createHtmlPlugins({ env, srcPath, entry, htmlWebpackPlugin });
    list.push(...items);
  }

  if (extractCss) {
    list.push(
      new MiniCssExtractPlugin({
        filename: digest ? `${assetsDir.css}[name].[contenthash:8].css` : `${assetsDir.css}[name].css`,
        chunkFilename: `${assetsDir.css}[name].[contenthash:8].chunk.css`
      })
    );
  }

  const publicDistPath = pathUtil.join(srcPath, 'public');
  if (fs.existsSync(publicDistPath)) {
    list.push(new CopyWebpackPlugin([{ from: publicDistPath }]));
  }

  list.push(
    new ManifestPlugin({
      fileName: manifestFileName || 'asset-manifest.json',
      publicPath: publicPath
    }),

    /** 定义一些环境变量 **/
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(getClientEnv())
    })
  );

  if (env === 'production') {
    list.push(...getProdPlugins({ swPrecache }));
  }

  return list;
}


function getClientEnv() {
  const map = {};
  const re = /^REACT_APP_/;
  for (const k in process.env) {
    if (re.test(k)) {
      map[k] = process.env[k];
    }
  }
  map.NODE_ENV = process.env.NODE_ENV || 'development';
  return map;
}


function createHtmlPlugins({ env, srcPath, entry, htmlWebpackPlugin = {} }) {
  const templatePath = htmlWebpackPlugin.template || pathUtil.join(srcPath, 'template.html');
  if (!fs.existsSync(templatePath)) {
    return [];
  }

  const opts = {
    inject: true,
    template: templatePath,
    minify: env === 'development' ? null : {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true
    },
    ...htmlWebpackPlugin
  };

  return Object.keys(entry).map(name => {
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      chunks: ['vendors', name],
      ...opts
    });
  });
}


function getProdPlugins({ swPrecache }) {
  return [
    // @see create-react-app/blob/next/packages/react-scripts/config/webpack.config.prod.js
    new SWPrecacheWebpackPlugin({
      // By default, a cache-busting query parameter is appended to requests
      // used to populate the caches, to ensure the responses are fresh.
      // If a URL is already hashed by Webpack, then there is no concern
      // about it being stale, and the cache-busting can be skipped.
      dontCacheBustUrlsMatching: /\.\w{8}\./,
      filename: 'service-worker.js',
      logger(message) {
        if (message.indexOf('Total precache size is') === 0) {
          // This message occurs for every build and is a bit too noisy.
          return;
        }
        if (message.indexOf('Skipping static resource') === 0) {
          // This message obscures real errors so we ignore it.
          // https://github.com/facebook/create-react-app/issues/2612
          return;
        }
        console.log(message); // eslint-disable-line
      },
      minify: true,
      // Don't precache sourcemaps (they're large) and build asset manifest:
      staticFileGlobsIgnorePatterns: [/\.map$/, /asset-manifest\.json$/],
      // `navigateFallback` and `navigateFallbackWhitelist` are disabled by default; see
      // https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#service-worker-considerations
      // navigateFallback: publicUrl + '/index.html',
      // navigateFallbackWhitelist: [/^(?!\/__).*/],
      ...swPrecache
    }),

    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

    /** 统计打包后的模块构成 **/
    new BundleAnalyzerPlugin({ analyzerMode: 'static' })
  ];
}
