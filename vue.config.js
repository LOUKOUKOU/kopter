// Inside vue.config.js
module.exports = {
    // ...other vue-cli plugin options...
    pwa: {
        manifestOptions: {
            orientation: "landscape",
            display: "fullscreen",
            background_color: "#F1AD2D"
        }
    },
    configureWebpack: {
        devServer: {
            host: '0.0.0.0'
        }
    }
}