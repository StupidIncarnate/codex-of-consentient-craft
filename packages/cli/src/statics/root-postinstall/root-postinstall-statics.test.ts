import { rootPostinstallStatics } from './root-postinstall-statics';

describe('rootPostinstallStatics', () => {
  it('VALID: {} => holds the guarded postinstall script, its marker and the npm lifecycle variable', () => {
    expect(rootPostinstallStatics).toStrictEqual({
      scriptKey: 'postinstall',
      script: 'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      marker: 'gateway-sync',
      lifecycle: {
        envName: 'npm_lifecycle_event',
        postinstallValue: 'postinstall',
      },
    });
  });
});
