import { slowFileThresholdStatics } from './slow-file-threshold-statics';

describe('slowFileThresholdStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(slowFileThresholdStatics).toStrictEqual({
      threshold: {
        warnMs: 5000,
      },
    });
  });
});
