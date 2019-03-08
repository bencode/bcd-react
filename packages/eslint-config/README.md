# eslint规则


在 [eslint-config-airbnb-base](https://github.com/airbnb/javascript) 基础上小调整了一些规则，具体规则在 [rules.js](rules.js)。


## 使用

```shell
yarn add eslint
yarn add eslint-config-bcd-react
```

在项目目录文件 `.eslintrc` 中配置


```js
{
  extends: 'bcd-react',

  rules: {
    // 这里可添加其他规则
  }
}
```


配置 `package.json`

```json
{
  "scripts": {
    "lint": "eslint src"
  }
}
```

然后就可以使用 `yarn lint` 检查代码规范。

