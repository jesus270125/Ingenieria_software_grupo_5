module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000
};
