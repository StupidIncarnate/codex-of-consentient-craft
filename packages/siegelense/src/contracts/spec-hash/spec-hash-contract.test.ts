import { specHashContract } from './spec-hash-contract';
import { SpecHashStub } from './spec-hash.stub';

describe('specHashContract', () => {
  it('VALID: {value: "a3f9c2e1"} => parses successfully', () => {
    const specHash = SpecHashStub({ value: 'a3f9c2e1' });

    const result = specHashContract.parse(specHash);

    expect(result).toBe('a3f9c2e1');
  });

  it('INVALID: {value: "A3F9C2E1"} => an uppercase hex string throws validation error', () => {
    expect(() => {
      specHashContract.parse('A3F9C2E1');
    }).toThrow(/Invalid/u);
  });

  it('INVALID: {value: "a3f9c2g1"} => a non-hex character throws validation error', () => {
    expect(() => {
      specHashContract.parse('a3f9c2g1');
    }).toThrow(/Invalid/u);
  });

  it('EDGE: {value: 8-character hex string} => the lower length bound parses successfully', () => {
    const result = specHashContract.parse('01234567');

    expect(result).toBe('01234567');
  });

  it('EDGE: {value: 64-character hex string} => the upper length bound parses successfully', () => {
    const value = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const result = specHashContract.parse(value);

    expect(result).toBe(value);
  });
});
