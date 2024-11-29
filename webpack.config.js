const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  require('dotenv').config({ 
    path: path.resolve(__dirname, '.env'),
    override: true 
  });
  require('dotenv').config({ 
    path: path.resolve(__dirname, '.env.defaults'),
    override: false 
  });

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',

    entry: {
      ui: './src/plugin/ui/ui.tsx',
      code: './src/plugin/controller/code.ts'
    },

    target: ['web', 'es5'],

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
                presets: [
                  ['@babel/preset-env', { targets: { browsers: ['last 2 versions', 'safari >= 7'] } }],
                  '@babel/preset-typescript',
                  '@babel/preset-react'
                ],
                plugins: [
                  '@babel/plugin-proposal-object-rest-spread',
                  '@babel/plugin-transform-spread',
                  '@babel/plugin-transform-destructuring'
                ]
              }
            },
            {
              loader: 'ts-loader',
              options: {
                configFile: path.resolve(__dirname, 'tsconfig.json'),
                transpileOnly: true,
                compilerOptions: {
                  target: 'es5'
                }
              },
            },
          ],
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
                    : '[name]__[local]___[hash:base64:5]',
                },
              },
            },
          ],
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
      },
    },

    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      environment: {
        arrowFunction: false,
        const: false,
        destructuring: false,
        dynamicImport: false,
        forOf: false,
        module: false
      }
    },

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 5,
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
            },
            format: {
              comments: false,
            },
          },
        }),
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/plugin/ui/ui.html',
        filename: 'ui.html',
        chunks: ['ui'],
        cache: false,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new Dotenv({
        path: '.env',
        safe: true,
        systemvars: true,
        silent: true,
      }),
    ],
  };
};
