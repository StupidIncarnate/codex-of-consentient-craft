import { rawOutputCapStatics } from './raw-output-cap-statics';

describe('rawOutputCapStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(rawOutputCapStatics).toStrictEqual({
      cap: {
        maxChars: 8000,
      },
    });
  });
});
