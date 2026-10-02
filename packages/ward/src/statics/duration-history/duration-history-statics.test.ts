import { durationHistoryStatics } from './duration-history-statics';

describe('durationHistoryStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(durationHistoryStatics).toStrictEqual({
      samplesKept: 5,
    });
  });
});
