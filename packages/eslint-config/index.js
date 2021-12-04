module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['jsx-a11y', 'react', '@typescript-eslint'],
  extends: [
    require.resolve('eslint-config-airbnb-base'),
    'plugin:react/recommended'
  ],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true
  },
  rules: {
    ...require('./rules'),
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error']
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
