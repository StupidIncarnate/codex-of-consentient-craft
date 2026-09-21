import { cleanupCliCallStatics } from './cleanup-cli-call-statics';

describe('cleanupCliCallStatics', () => {
  it('VALID: {cleanupCliCallStatics} => spawns dungeonmaster siegelense cleanup --json', () => {
    expect(cleanupCliCallStatics).toStrictEqual({
      call: {
        bin: 'dungeonmaster',
        args: ['siegelense', 'cleanup', '--json'],
      },
    });
  });
});
