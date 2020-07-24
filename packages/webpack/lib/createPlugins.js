const fs = require('fs');
const pathUtil = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = function createPlugins({
  env, digest, srcPath, publicPath, extractCss,
  assetsDir, entry, htmlWebpackPlugin, manifest,
  swPrecache, bundleAnalyzer, hardSource
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
    list.push(new CopyWebpackPlugin({
      patterns: [
        { from: publicDistPath }
      ]
    }));
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

  if (hardSource !== false) {
    list.push(new HardSourceWebpackPlugin(hardSource));
  }

  if (env === 'production') {
    list.push(...getProdPlugins({ swPrecache, bundleAnalyzer }));
  }

  return list;
};
//~ createPlugins


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
