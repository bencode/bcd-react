# bcd-react-webpack

Use webpack painless.


## examples

- [simple](../../examples/webpack)


## Usage


### 1. install

```shell
npm install --save-dev webpack webpack-cli webpack-dev-server bcd-react-webpack
```


### 2. update package.json

```json
{
  "scripts": {
    "start": "webpack-dev-server --hot --config config/webpack.config.js",
    "build": "NODE_ENV=production webpack --config config/webpack.config.js"
  }
}
```

### 3. create webpack config file

create webpack config file `config/webpack.config.js`

```js
const createConfig = require('bcd-react-webpack');

const env = process.env.NODE_ENV || 'development';

module.exports = createConfig({
  publicPath: env === 'development' ? '/' :
    // TODO: online assets url prefix, you should modify this
    'https://lesspage.oss-cn-shanghai.aliyuncs.com/'
});
```

### 4. add sass support

```
npm install --dev node-sass sass-loader
```


## Detail

### 1. project structure

```
- config/
  - webpack.config.js

- src/
  - template.html    # tempalte file for HtmlWebpackPlugin

  - pages/           # deduce webpack entries from pages dir
    - index/
      - index.js

    - design/           # muti entry support
      - index.js
      - index.html         # custom template

  - components/     # arbitrarily dir/packages。
  - utils/

- package.json
```

We also alias '@' for `src` dir.

```js
import Avatar from '@/components/Avatar';
// import Avatar from '../../../../components/Avatar';
```


### 2. stage

Muti entry pages may slowdown the building in current `webpack-dev-server`,
use arg `--stage` for only build specify entry page.

You can also config `stage` in config for forcing specify this arg in dev and build phase.

```js
module.exports = createConfig({
  ...,
  stage: true
});
```

### in package.json

```json
{
  "scripts": {
    "start": "webpack-dev-server --hot --config config/webpack.config.js"
  }
}
```

```shell
npm run start --stage mypage
```


### 3. custom config


```js
module.exports = createConfig({
  publicPath: env === 'development' ? '/' : './',

  devServer: { ... },        // @see https://webpack.js.org/configuration/dev-server/
  shouldUseSourceMap: true,  // use 'source-map', current default use 'cheap-module-source-map'
  extractCss: true,

  srcPath: 'src',            // source dir
  distPath: 'dist',          // output dir
  assetsDir: { js: 'js/', css: 'css/', media: 'media/' },   // output assets dir
  pagesPath: 'pages',

  digest: false,             // in production env, default to true
  swPrecache: false,         // disable SWPrecacheWebpackPlugin
  manifest: false,           // disable manifest file
  manifest: { fileName },    // custom manifest filename
  bundleAnalyzer: false,     // disable analyzer plugin
});
```
