const createConfig = require('bcd-react-webpack');

const env = process.env.NODE_ENV || 'development';

module.exports = createConfig({
  publicPath: env === 'development' ? '/' :
    // online assets url prefix
    'https://lesspage.oss-cn-shanghai.aliyuncs.com/'
});



console.log(module.exports);
