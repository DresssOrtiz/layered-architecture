module.exports = {
  moduleFileExtensions: ['js', 'json'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.js$',
  transform: { '^.+\\.js$': 'babel-jest' },
  setupFiles: ['reflect-metadata'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};
