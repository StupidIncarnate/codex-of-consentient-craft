import { importOriginContract } from './import-origin-contract';
import { ImportOriginStub } from './import-origin.stub';

describe('importOriginContract', () => {
  it.each(importOriginContract.options)(
    'VALID: {value: %s} => parses to the same text',
    (value) => {
      const result = ImportOriginStub({ value });

      expect(result).toBe(value);
    },
  );

  it('INVALID: {value: "nonsense"} => throws an invalid-option error', () => {
    expect(() => ImportOriginStub({ value: 'nonsense' as never })).toThrow(
      /^[\s\S]*Invalid option[\s\S]*$/u,
    );
  });
});
