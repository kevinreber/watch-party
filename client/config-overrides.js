const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    '@components': path.resolve(__dirname, 'src/components'),
    '@helpers': path.resolve(__dirname, 'src/helpers'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@hooks': path.resolve(__dirname, 'src/hooks'),
    '@api': path.resolve(__dirname, 'src/api'),
    '@context': path.resolve(__dirname, 'src/context'),
  }),
);
