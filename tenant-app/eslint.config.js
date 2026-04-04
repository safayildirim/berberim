// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');
const reactNativePlugin = require('eslint-plugin-react-native');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    plugins: {
      'react-native': reactNativePlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      'react-native/no-unused-styles': 'warn',
      'unused-imports/no-unused-imports': 'warn',
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
