import { censusFormatContract } from './census-format-contract';
import { CensusFormatStub } from './census-format.stub';

describe('censusFormatContract', () => {
  it.each(censusFormatContract.options)(
    'VALID: {value: %s} => parses to the same text',
    (value) => {
      const result = CensusFormatStub({ value });

      expect(result).toBe(value);
    },
  );

  it('INVALID: {value: "nonsense"} => throws an invalid-option error', () => {
    expect(() => CensusFormatStub({ value: 'nonsense' as never })).toThrow(
      /^[\s\S]*Invalid option[\s\S]*$/u,
    );
  });
});
