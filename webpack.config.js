// Webpack Configuration - Me POS by Mein Licht
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    mode: isProduction ? 'production' : 'development',

    // Entry points
    entry: {
      main: './src/js/main.js',
      // Add additional entry points if needed
      // vendor: ['firebase/app', 'firebase/auth', 'firebase/firestore']
    },

    // Output configuration
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction
        ? 'js/[name].[contenthash:8].js'
        : 'js/[name].js',
      chunkFilename: isProduction
        ? 'js/[name].[contenthash:8].chunk.js'
        : 'js/[name].chunk.js',
      clean: true,
      publicPath: '/',
      assetModuleFilename: 'assets/[hash][ext][query]'
    },

    // Module resolution
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@js': path.resolve(__dirname, 'src/js'),
        '@css': path.resolve(__dirname, 'src/css'),
        '@assets': path.resolve(__dirname, 'src/assets')
      }
    },

    // Module rules
    module: {
      rules: [
        // JavaScript/TypeScript
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not dead']
                  },
                  modules: false,
                  useBuiltIns: 'usage',
                  corejs: 3
                }]
              ],
              plugins: [
                '@babel/plugin-transform-runtime',
                '@babel/plugin-transform-class-properties',
                '@babel/plugin-transform-optional-chaining',
                '@babel/plugin-transform-nullish-coalescing-operator'
              ]
            }
          }
        },

        // CSS
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: isDevelopment
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    require('autoprefixer'),
                    require('cssnano')({
                      preset: 'default'
                    })
                  ]
                }
              }
            }
          ]
        },

        // Images
        {
          test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024 // 8kb
            }
          },
          generator: {
            filename: 'images/[name].[hash][ext][query]'
          }
        },

        // Fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash][ext][query]'
          }
        },

        // HTML (if needed)
        {
          test: /\.html$/i,
          loader: 'html-loader',
          options: {
            sources: {
              list: [
                {
                  tag: 'img',
                  attribute: 'src',
                  type: 'src',
                },
                {
                  tag: 'link',
                  attribute: 'href',
                  type: 'src',
                }
              ]
            }
          }
        }
      ]
    },

    // Plugins
    plugins: [
      // Clean output directory
      new CleanWebpackPlugin(),

      // HTML template
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
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
        templateParameters: {
          isProduction,
          version: require('./package.json').version
        }
      }),
      // Customer portal HTML
      new HtmlWebpackPlugin({
        template: './public/customer.html',
        filename: 'customer.html',
        inject: 'body',
        chunks: ['main'],
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
        templateParameters: {
          isProduction,
          version: require('./package.json').version,
        }
      }),
      // Admin portal HTML
      new HtmlWebpackPlugin({
        template: './public/admin.html',
        filename: 'admin.html',
        inject: 'body',
        chunks: ['main'],
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
        templateParameters: {
          isProduction,
          version: require('./package.json').version,
        }
      }),

      // Extract CSS to separate file in production
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash:8].css',
          chunkFilename: 'css/[name].[contenthash:8].chunk.css'
        })
      ] : []),

      // Copy static assets
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public',
            to: '.',
            globOptions: {
              ignore: ['**/index.html', '**/customer.html', '**/admin.html']
            }
          }
        ]
      }),

      // Environment variables
      new Dotenv({ systemvars: true }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.VERSION': JSON.stringify(require('./package.json').version),
        '__DEV__': JSON.stringify(isDevelopment),
        '__PROD__': JSON.stringify(isProduction)
      }),

      // Provide global variables
      new webpack.ProvidePlugin({
        // Add any global variables you need
      })
    ],

    // Optimization
    optimization: {
      minimize: isProduction,
      minimizer: [
        // JS minimization
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction
            },
            format: {
              comments: false
            }
          },
          extractComments: false
        }),

        // CSS minimization
        new CssMinimizerPlugin()
      ],

      // Split chunks
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      },

      // Runtime chunk
      runtimeChunk: {
        name: 'runtime'
      }
    },

    // Development server
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
      compress: true,
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      },
      setupMiddlewares: (middlewares, devServer) => {
        // Custom middleware if needed
        return middlewares;
      }
    },

    // Source maps
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',

    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },

    // Stats
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  };
};
