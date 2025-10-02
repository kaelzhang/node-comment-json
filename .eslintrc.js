module.exports = {
  parserOptions: {
    // To support BigInt
    ecmaVersion: 2020
  },
  env: {
    es2020: true,
    node: true
  },
  extends: require.resolve('@ostai/eslint-config'),
  rules: {
    'no-underscore-dangle': 0,
    'no-cond-assign': 0,
    'no-loop-func': 0,
    'operator-linebreak': 0
  }
}
