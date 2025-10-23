var path = require('path');
var webpack = require('webpack');

var pkg = require('./package.json');
var license =
  '@license ' +
  pkg.license +
  '\n' +
  pkg.name +
  ' ' +
  pkg.version +
  '\nCopyright New Relic <http://newrelic.com/>' +
  '\n@author ' +
  pkg.author;

module.exports = [
  {
    //umd
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, './dist/umd'),
      filename: 'newrelic-video-html5.min.js',
      library: 'Html5Tracker',
      libraryTarget: 'umd',
      libraryExport: 'default',
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.(?:js|mjs|cjs)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      chrome: '79',
                      node: '8',
                    },
                    useBuiltIns: 'usage',
                    corejs: 3,
                  },
                ],
              ],
              plugins: [
                '@babel/plugin-transform-modules-commonjs',
                '@babel/plugin-transform-optional-chaining',
                '@babel/plugin-transform-nullish-coalescing-operator',
              ],
            },
          },
        },
      ],
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: license,
        entryOnly: true,
      }),
    ],
  },
  // commonjs buid
  {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, './dist/cjs'),
      filename: 'index.js',
      library: 'Html5Tracker',
      libraryTarget: 'commonjs2', // CommonJS format
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.(js|mjs|cjs)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      chrome: '79',
                      node: '8',
                    },
                    useBuiltIns: 'usage',
                    corejs: 3,
                  },
                ],
              ],
              plugins: [
                '@babel/plugin-transform-modules-commonjs',
                '@babel/plugin-transform-optional-chaining',
                '@babel/plugin-transform-nullish-coalescing-operator',
              ],
            },
          },
        },
      ],
    },
    optimization: {
      minimize: true,
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: license,
        entryOnly: true,
      }),
    ],
  },
  // ES Module Build
  {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, './dist/esm'),
      filename: 'index.js',
      library: {
        type: 'module', // ES Module format
      },
    },
    experiments: {
      outputModule: true, // Enable ES Module output
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.(js|mjs|cjs)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      chrome: '79',
                      node: '8',
                    },
                    useBuiltIns: 'usage',
                    corejs: 3,
                    modules: false,
                  },
                ],
              ],
              plugins: [
                '@babel/plugin-transform-optional-chaining',
                '@babel/plugin-transform-nullish-coalescing-operator',
              ],
            },
          },
        },
      ],
    },
    optimization: {
      minimize: true,
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: license,
        entryOnly: true,
      }),
    ],
  },
];
