import { dungeonmasterBinStatics } from './dungeonmaster-bin-statics';

describe('dungeonmasterBinStatics', () => {
  it('VALID: {statics} => maps each binary to its owning package and names the manifest', () => {
    expect(dungeonmasterBinStatics).toStrictEqual({
      packages: {
        'dungeonmaster-ward': '@dungeonmaster/ward',
        dungeonmaster: '@dungeonmaster/cli',
      },
      layout: {
        manifest: 'package.json',
      },
    });
  });
});
