import { checkCommandsStatics } from './check-commands-statics';

describe('checkCommandsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(checkCommandsStatics).toStrictEqual({
      lint: {
        bin: 'eslint',
        args: ['--fix', '--stats', '--format', 'json', '.'],
        discoverPatterns: [
          'src/**/*.ts',
          'bin/**/*.ts',
          'test/**/*.ts',
          'src/**/*.tsx',
          'bin/**/*.tsx',
          'test/**/*.tsx',
          'src/**/*.js',
          'bin/**/*.js',
          'test/**/*.js',
          'src/**/*.jsx',
          'bin/**/*.jsx',
          'test/**/*.jsx',
          '*.ts',
          '*.js',
        ],
      },
      typecheck: {
        bin: 'tsc',
        args: ['--noEmit', '--listFiles'],
        discoverPatterns: ['src/**/*.ts', 'bin/**/*.ts', 'src/**/*.tsx', 'bin/**/*.tsx'],
      },
      unit: {
        bin: 'jest',
        args: [
          '--json',
          '--no-color',
          '--forceExit',
          '--detectOpenHandles',
          '--testPathIgnorePatterns',
          '\\.integration\\.test\\.(ts|tsx|js|jsx)$|\\.e2e\\.test\\.(ts|tsx|js|jsx)$',
        ],
        discoverPatterns: [
          'src/**/*.test.ts',
          'bin/**/*.test.ts',
          'test/**/*.test.ts',
          'src/**/*.test.tsx',
          'bin/**/*.test.tsx',
          'test/**/*.test.tsx',
          'src/**/*.test.js',
          'bin/**/*.test.js',
          'test/**/*.test.js',
          'src/**/*.test.jsx',
          'bin/**/*.test.jsx',
          'test/**/*.test.jsx',
        ],
        excludePatterns: [
          '**/*.integration.test.ts',
          '**/*.e2e.test.ts',
          '**/*.integration.test.tsx',
          '**/*.e2e.test.tsx',
          '**/*.integration.test.js',
          '**/*.e2e.test.js',
          '**/*.integration.test.jsx',
          '**/*.e2e.test.jsx',
        ],
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
          '\\.integration\\.test\\.(ts|tsx|js|jsx)$',
        ],
        discoverPatterns: [
          'src/**/*.integration.test.ts',
          'bin/**/*.integration.test.ts',
          'test/**/*.integration.test.ts',
          'src/**/*.integration.test.tsx',
          'bin/**/*.integration.test.tsx',
          'test/**/*.integration.test.tsx',
          'src/**/*.integration.test.js',
          'bin/**/*.integration.test.js',
          'test/**/*.integration.test.js',
          'src/**/*.integration.test.jsx',
          'bin/**/*.integration.test.jsx',
          'test/**/*.integration.test.jsx',
        ],
      },
      e2e: {
        bin: 'playwright',
        args: ['test', '--reporter=line,json'],
        discoverPatterns: ['**/*.e2e.ts'],
      },
    });
  });

  // A quality checker that emits is a build wearing another name: it writes into every package's
  // outDir, so two runs at once corrupt each other's output, and a consumer gets their tree
  // compiled by a tool they asked to grade it. `tsc -b` is the only way a check reaches build
  // mode, so the absence of that flag is the whole invariant.
  //
  // Derived rather than a second copy of the object above, so a check type added later is covered
  // the day it is added.
  describe('no check runs a compiler in build mode', () => {
    it('VALID: every check command => passes no build-mode flag', () => {
      // `.map(String)` widens each arg away from its `as const` literal type. Without it the
      // comparison is a TYPE ERROR the moment no check carries `-b` — the very state this asserts —
      // so the check would only compile while it was already failing.
      const buildModeChecks = Object.entries(checkCommandsStatics)
        .filter(([, command]) => command.args.map(String).includes('-b'))
        .map(([checkType]) => checkType);

      expect(buildModeChecks).toStrictEqual([]);
    });
  });
});
