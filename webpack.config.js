const path = require('path');
const aBrowsersList = require('./package.json').browserslist || [];


/**************************************************************************************************************************************************************/
const oConfig = {
    target: 'web',
    context: path.resolve(__dirname, './src/'),
    devtool: 'eval-source-map',

    entry: {
        app: './js/main.js',
    },

    output: {
        path: path.resolve(__dirname, './src/'), 
        publicPath: '/',
        filename: './chart.js'
    },

    module: {
        rules: [{ 
            test: /\.js$/,
            exclude: /[\/\\]node_modules[\/\\]/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [['@babel/preset-env', {
                        targets: {
                            browsers: aBrowsersList // For some reason it doesn't work from package.json.
                        }
                    }]],
                    cacheDirectory: true
                }
            }
        }]
    },

    resolve: { extensions: ['.js'] },
    performance: { hints: false },
    stats: { children: false }
};


/**************************************************************************************************************************************************************/
module.exports = function (env, argv) {
    const production = argv.mode === 'production';
    const oLocalConfig = Object.assign({}, oConfig);
    if (production) delete oLocalConfig.devtool;
    return oLocalConfig;
};