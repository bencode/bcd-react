module.exports = {
  parser: 'babel-eslint',
  extends: ['eslint-config-airbnb-base', 'plugin:react/recommended'],

  env: {
    browser: true,
    es6: true
  },

  globals: {
    expect: true,
    test: true
  },

  settings: {
    react: {
      version: '16'
    }
  },

  rules: require('./rules')
};
