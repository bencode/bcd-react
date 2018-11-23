const createConfig = require('bcd-react-webpack');

const env = process.env.NODE_ENV || 'development';

module.exports = createConfig({
  publicPath: env === 'development' ? '/' :
    'https://lesspage.oss-cn-shanghai.aliyuncs.com/',

  // manifest: false,
  // bundleAnalyzer: false
});
