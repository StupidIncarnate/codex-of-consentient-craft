import { checkCommandsStatics } from './check-commands-statics';

describe('checkCommandsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(checkCommandsStatics).toStrictEqual({
      lint: {
        bin: 'eslint',
        args: ['--fix', '--stats', '--format', 'json', '.'],
        discoverPatterns: ['src/**/*.ts', 'src/**/*.tsx', 'bin/**/*.ts', '*.ts', '*.js'],
      },
      typecheck: {
        bin: 'tsc',
        args: ['--noEmit', '--listFiles'],
        discoverPatterns: ['src/**/*.ts', 'src/**/*.tsx', 'bin/**/*.ts'],
      },
      unit: {
        bin: 'jest',
        args: [
          '--json',
          '--no-color',
          '--forceExit',
          '--detectOpenHandles',
          '--testPathIgnorePatterns',
          '\\.integration\\.test\\.ts$|\\.e2e\\.test\\.ts$',
        ],
        discoverPatterns: ['src/**/*.test.ts', 'bin/**/*.test.ts'],
        excludePatterns: ['**/*.integration.test.ts', '**/*.e2e.test.ts'],
      },
      integration: {
        bin: 'jest',
        args: [
          '--json',
          '--no-color',
          '--forceExit',
          '--detectOpenHandles',
          '--testTimeout=30000',
          '--testPathPatterns',
          '\\.integration\\.test\\.ts$',
        ],
        discoverPatterns: ['src/**/*.integration.test.ts', 'bin/**/*.integration.test.ts'],
      },
      e2e: {
        bin: 'playwright',
        args: ['test', '--reporter=line'],
        discoverPatterns: ['tests/e2e/**/*.spec.ts', 'e2e/**/*.spec.ts'],
      },
    });
  });
});
