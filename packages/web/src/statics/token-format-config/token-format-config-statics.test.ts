import { tokenFormatConfigStatics } from './token-format-config-statics';

describe('tokenFormatConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(tokenFormatConfigStatics).toStrictEqual({
      abbreviationThreshold: 1000,
      abbreviationDivisor: 1000,
      charsPerTokenEstimate: 3.7,
    });
  });
});
