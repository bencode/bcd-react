const fs = require('fs');
const pathUtil = require('path');
const webpack = require('webpack');
const createConfig = require('../webpack/config');

const debug = require('debug')('command/start');


module.exports = async function(path, opts) {
  const srcPath = path ? pathUtil.resolve(path) : guessSrcPath();
  if (!srcPath) {
    console.error('please specify assets root');
    return;
  }

  const env = process.env.NODE_ENV || 'development';
  process.env.NODE_ENV = env;

  const distPath = pathUtil.resolve(opts.o || 'dist');
  const config = createConfig({
    env, srcPath, distPath
  });
  debug('config: %o', config);

  const stats = await webpackWatch(config);
  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.error(info.errors);
    return;
  }
  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
};


function webpackWatch(config) {
  const compiler = webpack(config);
  return new Promise((resolve, reject) => {
    const watching = compiler.run((err, stats) => {
      err ? reject(err) : resolve(stats);
    });
    // watching.close(() => {
    //   console.log('Watching Ended.');
    // });
  });
}


function guessSrcPath() {
  const cwd = process.cwd();
  return ['assets', 'src', 'static']
    .map(name => pathUtil.join(cwd, name))
    .find(path => fs.existsSync(path) && fs.statSync(path).isDirectory());
}
