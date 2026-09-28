import { replacementEntryContract } from './replacement-entry-contract';
import { ReplacementEntryStub } from './replacement-entry.stub';

describe('replacementEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {oldId, newId} => parses successfully', () => {
      const result = ReplacementEntryStub();

      expect(result).toStrictEqual({
        oldId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        newId: '03a9d8d8-7d74-4041-981c-977812e6dc45',
      });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {missing oldId} => throws validation error', () => {
      expect(() => {
        return replacementEntryContract.parse({
          newId: '03a9d8d8-7d74-4041-981c-977812e6dc45',
        });
      }).toThrow(/received undefined/u);
    });
  });
});
