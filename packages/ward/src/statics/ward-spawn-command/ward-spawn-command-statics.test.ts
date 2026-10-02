import { wardSpawnCommandStatics } from './ward-spawn-command-statics';

describe('wardSpawnCommandStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(wardSpawnCommandStatics).toStrictEqual({
      bin: 'dungeonmaster-ward',
      entryScriptExtension: '.js',
      baseArgs: ['run'],
      parentScopedFlag: '--parentScoped',
      jestWorkersFlag: '--jestWorkers',
    });
  });
});
