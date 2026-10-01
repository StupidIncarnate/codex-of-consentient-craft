import { dungeonmasterBinStatics } from './dungeonmaster-bin-statics';

describe('dungeonmasterBinStatics', () => {
  it('VALID: {dungeonmasterBinStatics} => maps each spawned binary to the package that owns it', () => {
    expect(dungeonmasterBinStatics).toStrictEqual({
      packages: {
        'dungeonmaster-ward': '@dungeonmaster/ward',
        dungeonmaster: '@dungeonmaster/cli',
      },
      layout: {
        modulesDir: 'node_modules',
        manifest: 'package.json',
      },
    });
  });
});
