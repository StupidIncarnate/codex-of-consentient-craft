import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { gatewaySourceCopyStatics } from './gateway-source-copy-statics';

describe('gatewaySourceCopyStatics', () => {
  it('VALID: {} => copies node and browser, each from one of its own exported subpaths', () => {
    expect(gatewaySourceCopyStatics).toStrictEqual({
      sources: {
        [gatewayLocationsStatics.folders.node]: {
          specifier: '@dungeonmaster/node/fs',
          directories: ['src'],
        },
        [gatewayLocationsStatics.folders.browser]: {
          specifier: '@dungeonmaster/browser/fetch',
          directories: ['src'],
        },
      },
      browserDevDependencies: {
        'jest-environment-jsdom': '^30.0.0',
      },
    });
  });

  it('VALID: {} => the two copied folders are node and browser only, never a third or fourth', () => {
    expect(Object.keys(gatewaySourceCopyStatics.sources).sort()).toStrictEqual(
      [gatewayLocationsStatics.folders.node, gatewayLocationsStatics.folders.browser].sort(),
    );
  });
});
