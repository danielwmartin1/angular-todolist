// filepath: /c:/Users/danie/OneDrive/Coding/Projects/angular-todolist-main/angular-todolist-main/webpack.config.js
const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  plugins: [
    new Dotenv()
  ],
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify")
    }
  }
};