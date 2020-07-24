const fs = require('fs');
const pathUtil = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { packageExists } = require('./util');


module.exports = function createRules(opts) {
  const reJs = /\.(js|jsx|ts|tsx)$/;
  const rules = [
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
      test: /\.svg$/,
      issuer: {
        test: reJs
      },
      use: [require.resolve('@svgr/webpack')]
    },
    {
      test: /\.svg$/,
      issuer: {
        test: path => !reJs.test(path)
      },
      use: [require.resolve('url-loader')]
    },
    {
      test: /\.(woff|woff2|eot|ttf)$/,
      use: [
        {
          loader: require.resolve('url-loader'),
          options: {
            limit: 8192
          }
        }
      ]
    },
    {
      test: /\.tsx?$/,
      use: require.resolve('ts-loader'),
      exclude: /node_modules/
    },
    {
      test: /\.jsx?$/,
      enforce: 'pre',
      exclude: [/[/\\\\]node_modules[/\\\\]/],
      use: [
        {
          loader: require.resolve('source-map-loader')
        },
        hasEslintConfig(opts.root) ? {
          loader: require.resolve('eslint-loader'),
          options: {
            eslintPath: pathUtil.join(opts.root, 'node_modules/eslint')
          }
        } : null
      ].filter(v => v)
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

  return rules.filter(rule => !!rule.use);
};
//~ createRules


function getStyleLoader({ env, extractCss, processor, shouldUseSourceMap }) {
  if (processor && !packageExists(processor)) {
    return null;
  }

  const loaders = [
    extractCss ? MiniCssExtractPlugin.loader : require.resolve('style-loader'),
    {
      loader: require.resolve('css-loader'),
      options: {
        modules: {
          mode: 'global',
          localIdentName: env === 'development' ?
            '[path][name]__[local]--[hash:base64:5]' : '[local]-[hash:base64:5]'
        }
      }
    },
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


function hasEslintConfig(root) {
  const files = ['.eslintrc', '.eslintrc.js'];
  return files.some(name => fs.existsSync(pathUtil.join(root, name)));
}
