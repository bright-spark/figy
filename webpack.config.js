const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  // Explicitly load .env files
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

    target: 'web',

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: path.resolve(__dirname, 'tsconfig.json')
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
      publicPath: '/',
    },

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
            },
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        chunks: 'async',
      },
    },

    plugins: [
      new Dotenv({
        path: path.resolve(__dirname, '.env'),
        defaults: path.resolve(__dirname, '.env.defaults'),
        safe: true,
        systemvars: true,
        allowEmptyValues: true,
      }),

      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'process.env.FIGMA': JSON.stringify(true),
        'process.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY || ''),
        'process.env.FIGMA_ACCESS_TOKEN': JSON.stringify(process.env.FIGMA_ACCESS_TOKEN || ''),
      }),

      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),

      new HtmlWebpackPlugin({
        template: './src/plugin/ui/ui.html',
        filename: 'ui.html',
        chunks: ['ui'],
        inject: 'body',
        scriptLoading: 'blocking',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false,
      }),
    ],

    performance: {
      maxEntrypointSize: 4000000,
      maxAssetSize: 4000000,
      hints: isProduction ? 'warning' : false,
    },
  };
};
