const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'https://api.quotable.io',  // API base URL
        changeOrigin: true, // For virtual hosted sites
        secure: false,      // If using HTTPS
        pathRewrite: { '^/api': '' },  // Rewrite the URL path (optional)
      },
      '/other-api': {
        target: 'https://zenquotes.io/api', // Another API base URL
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/other-api': '' }, // Optional path rewrite
      },
    },
  },
})
