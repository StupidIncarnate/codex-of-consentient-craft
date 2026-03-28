import { wardSpawnCommandStatics } from './ward-spawn-command-statics';

describe('wardSpawnCommandStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(wardSpawnCommandStatics).toStrictEqual({
      bin: 'dungeonmaster-ward',
      baseArgs: ['run'],
    });
  });
});
