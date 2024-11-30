import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import Dotenv from 'dotenv-webpack';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  dotenv.config({ 
    path: path.resolve(__dirname, '.env'),
    override: true 
  });
  dotenv.config({ 
    path: path.resolve(__dirname, '.env.defaults'),
    override: false 
  });

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: false,
    target: ['web', 'es5'],

    entry: {
      ui: [
        path.resolve(__dirname, 'src/polyfills.js'),
        'core-js/stable',
        'regenerator-runtime/runtime',
        './src/plugin/ui/ui.tsx'
      ],
      code: [
        path.resolve(__dirname, 'src/polyfills.js'),
        'core-js/stable',
        'regenerator-runtime/runtime',
        './src/plugin/controller/code.ts'
      ]
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                configFile: path.resolve(__dirname, '.babelrc')
              }
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  auto: true,
                  localIdentName: isProduction 
                    ? '[hash:base64:5]' 
                    : '[name]__[local]___[hash:base64:5]'
                }
              }
            }
          ]
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: {
                minimize: isProduction,
              },
            },
          ],
        },
      ],
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.html'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'process': 'process/browser'
      },
      fallback: {
        "path": false,
        "fs": false,
        "crypto": false,
        "process": false,
        "buffer": false,
        "stream": false
      }
    },

    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      globalObject: '(typeof self !== "undefined" ? self : this)',
      chunkLoadingGlobal: 'webpackChunkfigy',
      environment: {
        arrowFunction: false,
        bigIntLiteral: false,
        const: false,
        destructuring: false,
        dynamicImport: false,
        forOf: false,
        module: false,
        optionalChaining: false,
        templateLiteral: false
      }
    },

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 5,
            parse: {
              ecma: 5
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: isProduction ? ['console.info', 'console.debug', 'console.warn'] : []
            },
            mangle: {
              safari10: true,
              keep_fnames: true
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true
            }
          }
        })
      ],
      splitChunks: {
        chunks: 'async',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      }
    },

    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'self': JSON.stringify(false),
        'window': JSON.stringify(false),
        'global': JSON.stringify(false)
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer']
      }),
      new HtmlWebpackPlugin({
        template: './src/plugin/ui/ui.html',
        filename: 'ui.html',
        chunks: ['ui'],
        cache: false
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new Dotenv({
        path: '.env',
        safe: true,
        systemvars: true,
        silent: true
      }),
      new webpack.BannerPlugin({
        banner: 'var self = (function(){ return this; })();',
        raw: true,
        entryOnly: true
      })
    ]
  };
};
