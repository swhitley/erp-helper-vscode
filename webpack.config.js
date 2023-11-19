/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const baseConfig = {
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

    entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: 'source-map',
    infrastructureLogging: {
        level: "log", // enables logging required for problem matchers
    },
    externals: {
        vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader',
            }]
        },
        {
          test: /\.(jpe?g|png|gif|svg|css|ttf)$/i,
          use: [{
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: ''
            }
          }    
        ]
      }
    ]
    },
};

// Config for webview source code (to be run in a web-based context)
/**@type {import('webpack').Configuration}*/
const apiCallsConfig = {
    ...baseConfig,
    target: ["web", "es2020"],
    entry: "./src/scripts/apicalls.ts",
    experiments: { outputModule: true },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "apicalls.js",
      libraryTarget: "module",
      chunkFormat: "module",
    }
  };


  /**@type {import('webpack').Configuration}*/
const connectionsConfig = {
    ...baseConfig,
    target: ["web", "es2020"],
    entry: "./src/scripts/connections.ts",
    experiments: { outputModule: true },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "connections.js",
      libraryTarget: "module",
      chunkFormat: "module",
    }
  };

  /**@type {import('webpack').Configuration}*/
const webservicesConfig = {
    ...baseConfig,
    target: ["web", "es2020"],
    entry: "./src/scripts/webservices.ts",
    experiments: { outputModule: true },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "webservices.js",
      libraryTarget: "module",
      chunkFormat: "module",
    }
  };

module.exports = [baseConfig, apiCallsConfig, connectionsConfig, webservicesConfig];