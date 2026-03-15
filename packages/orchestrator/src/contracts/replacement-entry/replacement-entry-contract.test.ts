import { replacementEntryContract } from './replacement-entry-contract';
import { ReplacementEntryStub } from './replacement-entry.stub';

describe('replacementEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {oldId, newId} => parses successfully', () => {
      const result = ReplacementEntryStub();

      expect(result.oldId).toBe('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
      expect(result.newId).toBe('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e');
    });
  });

  describe('invalid entries', () => {
    it('INVALID_OLD_ID: {missing oldId} => throws validation error', () => {
      expect(() => {
        return replacementEntryContract.parse({
          newId: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        });
      }).toThrow(/Required/u);
    });
  });
});
