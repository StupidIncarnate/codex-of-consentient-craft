import { gatewaySourceCopyStatics } from './gateway-source-copy-statics';

describe('gatewaySourceCopyStatics', () => {
  it('VALID: {} => copies node and browser, each from one of its own exported subpaths', () => {
    expect(gatewaySourceCopyStatics).toStrictEqual({
      sources: {
        node: { specifier: '@dungeonmaster/node/fs', directories: ['src'] },
        browser: { specifier: '@dungeonmaster/browser/fetch', directories: ['src', '__mocks__'] },
      },
      browserDevDependencies: {
        'jest-environment-jsdom': '^30.0.0',
        undici: '^7.21.0',
      },
    });
  });
});
