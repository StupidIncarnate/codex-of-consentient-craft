const { resolve, dirname } = require('path');
const baseConfig = require('../../jest.config.base.js');

// Resolve react/react-dom to their actual install location so the test suite shares a
// single React instance regardless of whether npm hoists them to the repo root or nests
// them under packages/web. require.resolve follows npm's resolution from this package.
const reactDir = dirname(require.resolve('react/package.json'));
const reactDomDir = dirname(require.resolve('react-dom/package.json'));

module.exports = {
  ...baseConfig,
  preset: undefined,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
    url: 'http://localhost',
  },
  roots: ['<rootDir>/src', '<rootDir>/test'],
  setupFiles: ['<rootDir>/src/__mocks__/jsdom-polyfills.cjs'],
  setupFilesAfterEnv: [
    '<rootDir>/../../packages/testing/src/jest.setup.js',
    '<rootDir>/../../packages/testing/dist/src/startup/start-endpoint-mock-setup.js',
    '@testing-library/jest-dom',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Jest collects src/**/*.test.ts(x) plus harness unit tests under test/**/*.test.ts(x).
  // Playwright e2e specs (src/flows/**/*.e2e.ts) and harness fixtures (test/**/*.harness.ts)
  // deliberately do NOT match this pattern, so Jest never collects them — they run under
  // Playwright via playwright.config.ts.
  testMatch: ['**/src/**/*.test.[jt]s?(x)', '<rootDir>/test/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/style-mock.cjs',
    '^react$': reactDir,
    '^react-dom$': reactDomDir,
    '^react-dom/(.*)$': `${reactDomDir}/$1`,
    '^react/(.*)$': `${reactDir}/$1`,
    '^elkjs$': '<rootDir>/src/__mocks__/elkjs-mock.cjs',
    '^@tabler/icons-react$': '<rootDir>/src/__mocks__/tabler-icons-mock.cjs',
    '^@xyflow/react$': '<rootDir>/src/__mocks__/xyflow-react-mock.cjs',
  },
  transformIgnorePatterns: [
    '/dist/',
    '/node_modules/(?!(msw|@mswjs|until-async|outvariant|undici)/)',
  ],
  transform: {
    '^.+\\.m?[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: resolve(__dirname, 'tsconfig.test.json'),
        astTransformers: {
          before: [
            {
              path: require.resolve('../../packages/testing/ts-jest/proxy-mock-transformer.js'),
            },
          ],
        },
      },
    ],
  },
};
