const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    
    // This is necessary because Figma's 'eval' works differently than normal eval
    devtool: isProduction ? false : 'inline-source-map',

    entry: {
      ui: './src/plugin/ui/ui.tsx', // The UI entry point
      code: './src/plugin/controller/code.ts', // The plugin code entry point
    },

    module: {
      rules: [
        // Transforms TypeScript and React/JSX
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true, // Faster builds
                experimentalWatchApi: true,
                configFile: path.resolve(__dirname, 'tsconfig.json'),
              },
            },
          ],
        },
        // Handles CSS modules
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  localIdentName: '[name]__[local]___[hash:base64:5]',
                },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    'postcss-preset-env',
                    'autoprefixer',
                  ],
                },
              },
            },
          ],
        },
        // Handles images and assets
        {
          test: /\.(png|jpg|gif|webp|svg)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8192, // 8kb
            },
          },
        },
      ],
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@plugin': path.resolve(__dirname, 'src/plugin'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@utils': path.resolve(__dirname, 'src/plugin/utils'),
      },
    },

    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true, // Clean the output directory before emit
    },

    optimization: {
      minimize: isProduction,
      // Don't split chunks for Figma plugin
      splitChunks: {
        chunks: 'all',
        name: false,
      },
      // Ensure proper module concatenation
      concatenateModules: true,
    },

    plugins: [
      // Handle environment variables
      new Dotenv({
        systemvars: true, // Load system environment variables
        safe: true, // Load .env.example variables
      }),
      
      // Define global variables
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'process.env.FIGMA': JSON.stringify(true),
        'global': '(typeof self !== "undefined" ? self : this)', // Fix for Figma's environment
      }),

      // Generate UI HTML
      new HtmlWebpackPlugin({
        template: './src/plugin/ui/ui.html',
        filename: 'ui.html',
        chunks: ['ui'],
        cache: false,
        inject: 'body',
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

      // Inline all chunks for Figma
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),
    ],

    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000, // 500KB
      maxAssetSize: 512000,
    },
  };
};
