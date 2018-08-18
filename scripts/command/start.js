const fs = require('fs');
const pathUtil = require('path');
const { promisify } = require('bluebird');
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
  const distPath = pathUtil.resolve(opts.o || 'dist');
  const config = createConfig({
    env, srcPath, distPath
  });
  debug('config: %o', config);

  const stats = await promisify(webpack)(config);
  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.error(info.errors);
    return;
  }
  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
};


function guessSrcPath() {
  const cwd = process.cwd();
  return ['assets', 'src', 'static']
    .map(name => pathUtil.join(cwd, name))
    .find(path => fs.existsSync(path) && fs.statSync(path).isDirectory());
}
