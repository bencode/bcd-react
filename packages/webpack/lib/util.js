const fs = require('fs');

exports.isFile = path => {
  return fs.existsSync(path) && fs.statSync(path).isFile();
};

exports.isDirectory = path => {
  return fs.existsSync(path) && fs.statSync(path).isDirectory();
};

exports.packageExists = name => {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    return false;
  }
};
