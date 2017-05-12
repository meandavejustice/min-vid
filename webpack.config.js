module.exports = [
  {
    name: 'addon',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['es2015']
            }
          }
        }
      ]
    },
    entry: './webextension/background.js',
    output: {
      filename: './webextension/dist/background.bundle.js'
    }
  },
  {
    name: 'frontend',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['es2015', 'react']
            }
          }
        }
      ]
    },
    entry: './frontend/app.js',
    output: {
      filename: './chrome/content/frontend.bundle.js'
    }
  }
];
