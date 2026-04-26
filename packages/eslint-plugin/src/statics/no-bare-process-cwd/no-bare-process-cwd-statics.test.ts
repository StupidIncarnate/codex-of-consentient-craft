import { noBareProcessCwdStatics } from './no-bare-process-cwd-statics';

describe('noBareProcessCwdStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(noBareProcessCwdStatics).toStrictEqual({
      defaults: {
        allowedFiles: ['**/src/startup/start-install.ts'],
        allowedFolders: ['**/src/adapters/process/cwd/**'],
        allowTestFiles: true,
      },
      testCompanionSuffixes: ['.harness.ts', '.harness.tsx', '.proxy.ts', '.proxy.tsx'],
    });
  });
});
