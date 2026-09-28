import { censusLayoutStatics } from './census-layout-statics';

describe('censusLayoutStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(censusLayoutStatics).toStrictEqual({
      packageJsonFile: 'package.json',
      packageJsonGlobs: ['packages/*/package.json', 'packages/@*/*/package.json'],
      sourceGlob: 'packages/**/*.{ts,tsx}',
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/.ward/**',
        '**/test-results/**',
        '**/coverage/**',
      ],
      adaptersSegment: '/src/adapters/',
      gatewayRoot: 'packages/@gateway',
      gatewayImportPrefix: '#gateway',
      importSuffixes: ['.ts', '.tsx', '/index.ts', '/index.tsx'],
      tableHeader: ['adapter', 'shape', 'gateway', 'prod', 'test', 'proxies', 'catch-all', 'why'],
      tableColumnGap: '  ',
      snippetMaxLength: 80,
      jsonIndent: 2,
      readChunkSize: 200,
      barrelDepthLimit: 8,
      staging: {
        addressMethods: ['calledWith', 'onceFor'],
        readBackMethod: 'callsMatching',
      },
    });
  });
});
