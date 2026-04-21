import { FolderTypeGroupsStub } from './folder-type-groups.stub';
import { folderTypeGroupsContract } from './folder-type-groups-contract';
import { defaultBatchGroupsStatics } from '../../statics/default-batch-groups/default-batch-groups-statics';

describe('folderTypeGroupsContract', () => {
  describe('valid input', () => {
    it('VALID: [[contracts, statics], [guards]] => parses to branded groups', () => {
      const result = FolderTypeGroupsStub({ value: [['contracts', 'statics'], ['guards']] });

      expect(result).toStrictEqual([['contracts', 'statics'], ['guards']]);
    });

    it('VALID: [] => parses to empty array (explicit opt-out)', () => {
      const result = FolderTypeGroupsStub({ value: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('default', () => {
    it('VALID: undefined => parses to curated default', () => {
      const result = folderTypeGroupsContract.parse(undefined);

      expect(result).toStrictEqual(defaultBatchGroupsStatics.value);
    });
  });

  describe('invalid input', () => {
    it('INVALID: [[]] => throws (inner array must be non-empty)', () => {
      expect(() => FolderTypeGroupsStub({ value: [[]] })).toThrow(/Array must contain/u);
    });

    it('INVALID: [[contracts], [contracts]] => throws (duplicate folder type across groups)', () => {
      expect(() => FolderTypeGroupsStub({ value: [['contracts'], ['contracts']] })).toThrow(
        'folder types may appear in at most one batch group',
      );
    });

    it('INVALID: [[contracts, contracts]] => throws (duplicate within group)', () => {
      expect(() => FolderTypeGroupsStub({ value: [['contracts', 'contracts']] })).toThrow(
        'folder types may appear in at most one batch group',
      );
    });

    it('INVALID: [[bogus-folder]] => throws (enum violation)', () => {
      expect(() => FolderTypeGroupsStub({ value: [['bogus-folder']] })).toThrow(
        /Invalid enum value/u,
      );
    });
  });
});
