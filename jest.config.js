module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'jsx'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  transformIgnorePatterns: ['node_modules/(?!@newrelic)/'],
  testMatch: ['**/__test__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  moduleNameMapper: {
    '^@newrelic/video-core$': '@newrelic/video-core/__mock__.js'
  },
  coverageThreshold: {
    global: {
      branches: 83,// Current: 83.01% - will increase gradually
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
