import { scanStatics } from './scan-statics';

describe('scanStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(scanStatics).toStrictEqual({
      batch: { maxFiles: 4 },
      eslint: {
        bin: 'eslint',
        formatArgs: ['--format', 'json', '--no-warn-ignored'],
        configFlag: '--config',
        severity: 'error',
      },
      config: {
        wrapperName: 'eslint.scan.config.cjs',
        tempDirPrefix: 'ward-scan-',
      },
      exitCodes: { clean: 0, violationsFound: 1 },
    });
  });
});
