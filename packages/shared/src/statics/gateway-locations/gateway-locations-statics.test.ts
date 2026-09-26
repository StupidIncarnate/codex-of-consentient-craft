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
      packageGlobs: [
        'packages/npm/src/**',
        'packages/node/src/**',
        'packages/browser/src/**',
        'packages/bin/src/**',
      ],
    });
  });

  it('VALID: {folder} => every packageGlobs entry names one of the four folders', () => {
    const folderNames = Object.values(gatewayLocationsStatics.folders);

    const globFolders = gatewayLocationsStatics.packageGlobs.map((glob) => glob.split('/')[1]);

    expect(globFolders).toStrictEqual(folderNames);
  });
});
