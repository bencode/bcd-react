module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-css-modules',
    'stylelint-config-rational-order'
  ],
  plugins: [
    'stylelint-scss'
  ],
  rules: {
    'color-hex-case': null,
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    'max-nesting-depth': 3,
    'selector-max-compound-selectors': 5
  }
}
