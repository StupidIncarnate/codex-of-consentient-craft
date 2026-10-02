import { noBareProcessCwdStatics } from './no-bare-process-cwd-statics';

describe('noBareProcessCwdStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(noBareProcessCwdStatics).toStrictEqual({
      defaults: {
        allowedFiles: ['**/src/startup/start-install.ts', '**/*.config.{ts,js,mjs,cjs}'],
        allowedFolders: [
          '**/packages/@gateway/node/src/process/**',
          '**/src/startup/**',
          '**/src/responders/**',
        ],
        allowTestFiles: true,
      },
      gateway: {
        processModule: '#gateway/node/process',
        cwdExport: 'cwd',
      },
      testCompanionSuffixes: ['.harness.ts', '.harness.tsx', '.proxy.ts', '.proxy.tsx'],
    });
  });
});
