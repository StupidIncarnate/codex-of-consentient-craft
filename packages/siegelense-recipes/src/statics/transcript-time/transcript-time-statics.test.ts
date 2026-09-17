import { transcriptTimeStatics } from './transcript-time-statics';

describe('transcriptTimeStatics', () => {
  it('VALID: exported value => matches the complete expected shape', () => {
    expect(transcriptTimeStatics).toStrictEqual({ conversion: { msPerSecond: 1000 } });
  });
});
