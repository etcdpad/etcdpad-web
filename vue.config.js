// eslint-disable-next-line @typescript-eslint/no-var-requires
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
    publicPath: './',
    devServer: {
        proxy: {
            '/epad': {
                target: 'http://10.101.44.14:8989',
                ws: true,
                // changeOrigin: true
            },
        },
    },
    css: {
        requireModuleExtension: true
    },
    configureWebpack: {
        plugins: [
            new MonacoWebpackPlugin(),
        ],
    },
}
