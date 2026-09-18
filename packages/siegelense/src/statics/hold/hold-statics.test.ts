import { holdStatics } from './hold-statics';

describe('holdStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(holdStatics).toStrictEqual({
      defaults: {
        frames: 4,
        everyMs: 1500,
        minFrames: 2,
      },
      verdicts: {
        nothingChanged: 'NOTHING CHANGED across {duration}s',
        stillChanging: 'still changing at {duration}s',
      },
    });
  });
});
