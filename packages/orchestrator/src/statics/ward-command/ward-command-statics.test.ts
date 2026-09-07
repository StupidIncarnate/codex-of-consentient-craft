import { wardCommandStatics } from './ward-command-statics';

describe('wardCommandStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(wardCommandStatics).toStrictEqual({
      bin: 'dungeonmaster-ward',
      typecheckArgs: ['run', '--only', 'typecheck'],
    });
  });
});
