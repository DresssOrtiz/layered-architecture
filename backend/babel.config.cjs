module.exports = {
  presets: [['@babel/preset-env', { targets: { node: '24' }, modules: 'commonjs' }]],
  plugins: [['@babel/plugin-proposal-decorators', { version: 'legacy' }]],
};
