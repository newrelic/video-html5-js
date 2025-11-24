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
    resolve: {
      alias: {
        '@newrelic/video-core': require.resolve('@newrelic/video-core/src/index.js')
      }
    },
    module: {
      rules: [
        {
          test: /\.(?:js|mjs|cjs)$/,
          exclude: /node_modules\/(?!@newrelic\/video-core\/src)/,
          use: {
            loader: 'babel-loader',
            options: {
              sourceType: 'unambiguous',
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      chrome: '53',
                      node: '8',
                    },
                    useBuiltIns: 'usage',
                    corejs: 3,
                  },
                ],
              ],
              plugins: [
                '@babel/plugin-transform-optional-chaining',
                '@babel/plugin-transform-nullish-coalescing-operator',
                '@babel/plugin-transform-object-rest-spread',
                '@babel/plugin-transform-class-properties',
                '@babel/plugin-transform-async-to-generator',
                '@babel/plugin-transform-for-of',
                '@babel/plugin-transform-parameters',
                '@babel/plugin-transform-destructuring',
                '@babel/plugin-transform-object-super',
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
    resolve: {
      alias: {
        '@newrelic/video-core': require.resolve('@newrelic/video-core/src/index.js')
      }
    },
    module: {
      rules: [
        {
          test: /\.(js|mjs|cjs)$/,
          exclude: /node_modules\/(?!@newrelic\/video-core\/src)/,
          use: {
            loader: 'babel-loader',
            options: {
              sourceType: 'unambiguous',
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      chrome: '53',
                      node: '8',
                    },
                    useBuiltIns: 'usage',
                    corejs: 3,
                  },
                ],
              ],
              plugins: [
                '@babel/plugin-transform-optional-chaining',
                '@babel/plugin-transform-nullish-coalescing-operator',
                '@babel/plugin-transform-object-rest-spread',
                '@babel/plugin-transform-class-properties',
                '@babel/plugin-transform-async-to-generator',
                '@babel/plugin-transform-for-of',
                '@babel/plugin-transform-parameters',
                '@babel/plugin-transform-destructuring',
                '@babel/plugin-transform-object-super',
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
    resolve: {
      alias: {
        '@newrelic/video-core': require.resolve('@newrelic/video-core/src/index.js')
      }
    },
    module: {
      rules: [
        {
          test: /\.(js|mjs|cjs)$/,
          exclude: /node_modules\/(?!@newrelic\/video-core\/src)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      chrome: '53',
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
                '@babel/plugin-transform-object-rest-spread',
                '@babel/plugin-transform-class-properties',
                '@babel/plugin-transform-async-to-generator',
                '@babel/plugin-transform-for-of',
                '@babel/plugin-transform-parameters',
                '@babel/plugin-transform-destructuring',
                '@babel/plugin-transform-object-super',
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
