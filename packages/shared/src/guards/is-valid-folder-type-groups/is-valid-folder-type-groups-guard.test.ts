import { FolderTypeStub } from '../../contracts/folder-type/folder-type.stub';
import { isValidFolderTypeGroupsGuard } from './is-valid-folder-type-groups-guard';

describe('isValidFolderTypeGroupsGuard', () => {
  it('VALID: {groups: []} => returns true (empty)', () => {
    const result = isValidFolderTypeGroupsGuard({ groups: [] });

    expect(result).toBe(true);
  });

  it('VALID: {groups: [[contracts, statics], [guards]]} => returns true (no duplicates)', () => {
    const result = isValidFolderTypeGroupsGuard({
      groups: [
        [FolderTypeStub({ value: 'contracts' }), FolderTypeStub({ value: 'statics' })],
        [FolderTypeStub({ value: 'guards' })],
      ],
    });

    expect(result).toBe(true);
  });

  it('INVALID: {groups: [[contracts], [contracts]]} => returns false (duplicate across groups)', () => {
    const result = isValidFolderTypeGroupsGuard({
      groups: [[FolderTypeStub({ value: 'contracts' })], [FolderTypeStub({ value: 'contracts' })]],
    });

    expect(result).toBe(false);
  });

  it('INVALID: {groups: [[contracts, contracts]]} => returns false (duplicate within group)', () => {
    const result = isValidFolderTypeGroupsGuard({
      groups: [[FolderTypeStub({ value: 'contracts' }), FolderTypeStub({ value: 'contracts' })]],
    });

    expect(result).toBe(false);
  });
});
