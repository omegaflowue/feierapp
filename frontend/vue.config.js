const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  configureWebpack: {
    plugins: []
  },
  chainWebpack: config => {
    // Disable ESLint
    config.module.rules.delete('eslint')
  },
  devServer: {
    port: 8080
  }
})