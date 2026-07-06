import { installScriptsStatics } from './install-scripts-statics';

describe('installScriptsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(installScriptsStatics).toStrictEqual({
      scripts: {
        ward: 'dungeonmaster-ward',
        lint: 'dungeonmaster-ward --only lint',
        typecheck: 'dungeonmaster-ward --only typecheck',
        test: 'dungeonmaster-ward --only test',
      },
    });
  });
});
