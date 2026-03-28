import { duplicateDetectionStatics } from './duplicate-detection-statics';

describe('duplicateDetectionStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(duplicateDetectionStatics).toStrictEqual({
      defaults: {
        threshold: 3,
        minLength: 3,
      },
    });
  });
});
