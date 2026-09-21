import { commitShaContract } from './commit-sha-contract';
import { CommitShaStub } from './commit-sha.stub';

describe('commitShaContract', () => {
  describe('valid input', () => {
    it('VALID: {40 hex characters} => parses to the same string', () => {
      const sha = CommitShaStub({ value: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0' });

      expect(String(commitShaContract.parse(sha))).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0');
    });

    it('EDGE: {7 hex characters} => parses, because git chooses the abbreviation length', () => {
      const sha = CommitShaStub({ value: 'a1b2c3d' });

      expect(String(sha)).toBe('a1b2c3d');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {6 hex characters} => throws', () => {
      expect(() => CommitShaStub({ value: 'a1b2c3' })).toThrow(/Invalid/u);
    });

    it('INVALID: {uppercase hex} => throws, because git prints lowercase', () => {
      expect(() => CommitShaStub({ value: 'A1B2C3D' })).toThrow(/Invalid/u);
    });

    it('EMPTY: {empty string} => throws', () => {
      expect(() => CommitShaStub({ value: '' })).toThrow(/Invalid/u);
    });
  });
});
