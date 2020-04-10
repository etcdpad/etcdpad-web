// eslint-disable-next-line @typescript-eslint/no-var-requires
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
    publicPath: './',
    css: {
        requireModuleExtension: true
    },
    configureWebpack: {
        plugins: [
            new MonacoWebpackPlugin(),
        ],
    },
}
