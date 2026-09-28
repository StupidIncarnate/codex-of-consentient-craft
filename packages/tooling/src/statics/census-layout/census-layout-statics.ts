/**
 * PURPOSE: Where the census looks and how it slices a repo: the globs it reads, the folder that
 * marks an adapter, and the gateway root. Every value is a layout fact of an npm-workspaces
 * monorepo with `packages/*` (and `packages/@gateway/*`); nothing here names a scope.
 *
 * USAGE:
 * await glob(censusLayoutStatics.sourceGlob, { cwd, ignore: censusLayoutStatics.ignore });
 */
export const censusLayoutStatics = {
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
} as const;
