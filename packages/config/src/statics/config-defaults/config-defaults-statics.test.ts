import { configDefaultsStatics } from './config-defaults-statics';

describe('configDefaultsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(configDefaultsStatics).toStrictEqual({
      defaults: {
        allowedRootFiles: ['global.d.ts'],
        booleanFunctionPrefixes: ['is', 'has', 'can', 'should', 'will', 'was'],
      },
      orchestration: {
        slotCount: {
          min: 1,
          max: 10,
          default: 3,
        },
        timeoutMs: {
          min: 60000,
          default: 900000,
        },
      },
      devServer: {
        buildCommand: 'npm run build',
        readinessPath: '/',
        port: {
          min: 1,
          max: 65535,
        },
        readinessTimeoutMs: {
          min: 1000,
          default: 30000,
        },
      },
    });
  });
});
