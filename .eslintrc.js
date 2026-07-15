module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    // DAM blocks expose several independently-authorable properties (facet
    // dimensions, hero metadata) that are clearer as separate fields than
    // element-grouped into one cell. Allow their specific cell counts.
    'xwalk/max-cells': ['error', {
      'asset-item': 7,
      'collection-hero': 6,
    }],
  },
};
