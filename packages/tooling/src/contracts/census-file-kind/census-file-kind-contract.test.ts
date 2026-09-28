import { censusFileKindContract } from './census-file-kind-contract';
import { CensusFileKindStub } from './census-file-kind.stub';

describe('censusFileKindContract', () => {
  it.each(censusFileKindContract.options)(
    'VALID: {value: %s} => parses to the same text',
    (value) => {
      const result = CensusFileKindStub({ value });

      expect(result).toBe(value);
    },
  );

  it('INVALID: {value: "nonsense"} => throws an invalid-option error', () => {
    expect(() => CensusFileKindStub({ value: 'nonsense' as never })).toThrow(
      /^[\s\S]*Invalid option[\s\S]*$/u,
    );
  });
});
