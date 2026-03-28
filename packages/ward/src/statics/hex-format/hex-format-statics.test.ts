import { hexFormatStatics } from './hex-format-statics';

describe('hexFormatStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(hexFormatStatics).toStrictEqual({
      radix: 16,
      sliceStart: 2,
      sliceEnd: 6,
    });
  });
});
