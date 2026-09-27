import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { gatewayFoldersStatics } from './gateway-folders-statics';

describe('gatewayFoldersStatics', () => {
  it('VALID: {} => lists the same folders, in the same order, as gatewayLocationsStatics.folders', () => {
    expect(gatewayFoldersStatics.folders).toStrictEqual(
      Object.values(gatewayLocationsStatics.folders),
    );
  });

  it('VALID: {} => carries one description per folder', () => {
    expect(gatewayFoldersStatics.descriptions).toStrictEqual({
      npm: 'Gateway package: one subpath per third-party npm package our code imports, named for it',
      node: 'Gateway package: everything the Node runtime provides, modules and globals alike',
      browser: 'Gateway package: everything the browser provides — globals and browser APIs',
      bin: 'Gateway package: programs installed on the machine, run through spawn',
    });
  });
});
