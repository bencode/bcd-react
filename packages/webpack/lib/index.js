const pathUtil = require('path');
const fs = require('fs');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
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
  root,
  srcPath, distPath, assetsDir,
  pagesPath, publicPath,
  entry,
  shouldUseSourceMap,
  digest, extractCss = true, manifest,
  htmlWebpackPlugin,
  swPrecache,
  bundleAnalyzer,
  devServer,
  stage,
  ...extra
} = {}) {
  env = env || process.env.NODE_ENV || 'development';
  root = root || process.cwd();
  srcPath = pathUtil.resolve(srcPath || 'src');
  distPath = pathUtil.resolve(distPath || 'dist');
  assetsDir = ensureAssetsDir(assetsDir);
  pagesPath = pagesPath || pathUtil.join(srcPath, 'pages');
  digest = digest === undefined ? env !== 'development' : digest;

  entry = entry || getEntry(pagesPath);
  entry = stage ? filterStageEntry(entry) : entry;

  const config = {
    devServer: createDevServerConfig({ distPath, devServer }),
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
      rules: getRules({ env, root, extractCss, assetsDir, shouldUseSourceMap })
    },
    plugins: getPlugins({
      env, digest, srcPath, publicPath, assetsDir,
      extractCss, entry, htmlWebpackPlugin, manifest,
      swPrecache, bundleAnalyzer
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
  assetsDir = assetsDir || {};
  return {
    js: assetsDir.js || 'js/',
    css: assetsDir.css || 'css/',
    media: assetsDir.media || 'media/'
  };
}


function createDevServerConfig({ devServer }) {
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
    },
    ...devServer
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


function hasEslintConfig(root) {
  const files = ['.eslintrc', '.eslintrc.js'];
  return files.some(name => fs.existsSync(pathUtil.join(root, name)));
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
      use: hasEslintConfig(opts.root) ? [
        {
          loader: require.resolve('eslint-loader'),
          options: {
            eslintPath: pathUtil.join(opts.root, 'node_modules/eslint')
          }
        }
      ] : []
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
      new TerserPlugin({
        cache: true,
        parallel: true,
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
  assetsDir, entry, htmlWebpackPlugin, manifest,
  swPrecache, bundleAnalyzer
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

  if (manifest !== false) {
    manifest = manifest || {};
    list.push(
      new ManifestPlugin({
        fileName: manifest.fileName || 'asset-manifest.json',
        publicPath: publicPath
      })
    );
  }

  list.push(
    /** 定义一些环境变量 **/
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(getClientEnv())
    })
  );

  if (env === 'production') {
    list.push(...getProdPlugins({ swPrecache, bundleAnalyzer }));
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
  return Object.keys(entry).map(name => {
    const template = deduceTemplate(name, entry[name], srcPath);
    return template ? { name, template } : null;
  }).filter(v => v).map(item => {
    return createHtmlPlugin({
      env,
      name: item.name,
      templatePath: item.template,
      htmlWebpackPlugin
    });
  });
}


function deduceTemplate(name, entryPath, srcPath) {
  const tryPaths = [
    pathUtil.join(entryPath, 'index.html'),
    pathUtil.join(srcPath, 'template.html')
  ];
  return tryPaths.find(path => fs.existsSync(path));
}


function createHtmlPlugin({ env, name, templatePath, htmlWebpackPlugin }) {
  htmlWebpackPlugin = transformOptions(htmlWebpackPlugin, name);

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

  return new HtmlWebpackPlugin({
    filename: `${name}.html`,
    chunks: ['vendors', name],
    ...opts
  });
}


function getProdPlugins({ swPrecache, bundleAnalyzer }) {
  const plugins = [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ];

  if (swPrecache !== false) {
    plugins.push(createSwPrecache(swPrecache));
  }

  // 统计打包后的模块构成
  if (bundleAnalyzer !== false) {
    plugins.push(
      new BundleAnalyzerPlugin({ analyzerMode: 'static', ...bundleAnalyzer })
    );
  }

  return plugins;
}


function createSwPrecache(swPrecache) {
  // @see create-react-app/blob/next/packages/react-scripts/config/webpack.config.prod.js
  return new SWPrecacheWebpackPlugin({
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
  });
}


function transformOptions(options, ...args) {
  if (typeof options === 'function') {
    options = options.apply(null, args);
  }
  return options;
}


function filterStageEntry(entry) {
  const chalk = require('chalk');
  const argv = require('minimist')(process.argv.slice(2));

  let names = argv.stage || [];
  names = Array.isArray(names) ? names : [names];
  if (!names.length) {
    global.console.log(chalk.red('please specify --state in command.\n  Example: npm start --stage mypage'));
    process.exit(1);
  }

  return names.reduce((acc, name) => {
    if (entry[name]) {
      acc[name] = entry[name];
    }
    return acc;
  }, {});
}
