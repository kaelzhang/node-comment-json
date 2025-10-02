module.exports = {
  parserOptions: {
    // To support BigInt
    ecmaVersion: 2020
  },
  extends: require.resolve('@ostai/eslint-config'),
  rules: {
    'no-underscore-dangle': 0,
    'no-cond-assign': 0,
    'no-loop-func': 0,
    'operator-linebreak': 0
  }
}
