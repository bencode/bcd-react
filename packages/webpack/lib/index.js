const pathUtil = require('path');
const fs = require('fs');
const { merge } = require('webpack-merge');
const debug = require('debug')('bcd-react-webpack');
const { isFile, isDirectory } = require('./util');
const createRules = require('./createRules');
const createPlugins = require('./createPlugins');
const createOptimization = require('./createOptimization');

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
  hardSource,
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

  debug('entry %o', entry);

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
      rules: createRules({ env, root, extractCss, assetsDir, shouldUseSourceMap })
    },
    plugins: createPlugins({
      env, digest, srcPath, publicPath, assetsDir,
      extractCss, entry, htmlWebpackPlugin, manifest,
      swPrecache, bundleAnalyzer, hardSource
    }),
    optimization: createOptimization({ env, shouldUseSourceMap }),
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
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
    const tryPath = pathUtil.join(pagesPath, name);
    debug('test entry: %s', tryPath);
    const path = deduceEntry(tryPath);
    if (path) {
      acc[name] = path;
    }
    return acc;
  }, {});
}


function deduceEntry(path) {
  const exts = ['.js', '.jsx', '.ts', '.tsx'];
  if (isFile(path)) {
    return exts.includes(pathUtil.extname(path)) ? path : null;
  }
  if (isDirectory(path)) {
    return exts.map(ext => pathUtil.join(path, `index${ext}`)).find(isFile);
  }
  return false;
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
