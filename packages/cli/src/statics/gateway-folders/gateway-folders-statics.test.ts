import { gatewayFoldersStatics } from './gateway-folders-statics';

describe('gatewayFoldersStatics', () => {
  it('VALID: {} => lists the four gateway folders in npm, node, browser, bin order', () => {
    expect(gatewayFoldersStatics.folders).toStrictEqual(['npm', 'node', 'browser', 'bin']);
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
