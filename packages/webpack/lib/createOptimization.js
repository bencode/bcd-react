const TerserPlugin = require('terser-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');


module.exports = function createOptimization({ env, shouldUseSourceMap }) {
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
          parser: safePostCssParser,
          discardComments: {
            removeAll: true
          }
        }
      })
    ]
  };
};

