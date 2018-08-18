# how-react-app

无配置快速构建React应用。


## eslint

在项目中添加eslint支持

```
yarn add --dev eslint eslint-config-how-react-app
```

添加文件 `.eslintrc`，内容如下：

```js
{
  extends: 'how-react-app',
  rules: {
  }
}
```

在`package.json`中添加命令：

```json
{
  "scripts": {
    "lint": "eslint src",   # 根据需要可更换目录
  }
}
```

然后就可以使用 `yarn lint` 运行eslint来检测js代码。
