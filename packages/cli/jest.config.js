import { createRequire } from 'module';
import baseConfig from '../../jest.config.base.js';

const require = createRequire(import.meta.url);

export default {
  ...baseConfig,
  roots: ['<rootDir>/src', '<rootDir>/bin'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx', '**/bin/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
          skipLibCheck: true,
          jsx: 'react',
        },
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
