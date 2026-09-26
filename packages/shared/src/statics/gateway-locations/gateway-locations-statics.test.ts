import { gatewayLocationsStatics } from './gateway-locations-statics';

describe('gatewayLocationsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(gatewayLocationsStatics).toStrictEqual({
      folders: {
        npm: 'npm',
        node: 'node',
        browser: 'browser',
        bin: 'bin',
      },
      importPrefix: '#gateway',
      testSubpath: '_test_',
      packageGlobs: [
        'packages/@gateway/npm/src/**',
        'packages/@gateway/node/src/**',
        'packages/@gateway/browser/src/**',
        'packages/@gateway/bin/src/**',
      ],
    });
  });

  it('VALID: {folder} => every packageGlobs entry names one of the four folders under packages/@gateway', () => {
    const folderNames = Object.values(gatewayLocationsStatics.folders);

    const globFolders = folderNames.map((folder) => `packages/@gateway/${folder}/src/**`);

    expect(gatewayLocationsStatics.packageGlobs).toStrictEqual(globFolders);
  });
});
