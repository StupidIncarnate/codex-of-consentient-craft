import { questFolderSequenceTransformer } from './quest-folder-sequence-transformer';
import { FolderNameStub } from '../../contracts/folder-name/folder-name.stub';

describe('questFolderSequenceTransformer', () => {
  it('VALID: {folders: []} => returns "001"', () => {
    const result = questFolderSequenceTransformer({ folders: [] });

    expect(result).toBe('001');
  });

  it('VALID: {folders: ["001-add-auth"]} => returns "002"', () => {
    const result = questFolderSequenceTransformer({
      folders: [FolderNameStub({ value: '001-add-auth' })],
    });

    expect(result).toBe('002');
  });

  it('VALID: {folders: ["001-add-auth", "002-fix-bug"]} => returns "003"', () => {
    const result = questFolderSequenceTransformer({
      folders: [
        FolderNameStub({ value: '001-add-auth' }),
        FolderNameStub({ value: '002-fix-bug' }),
      ],
    });

    expect(result).toBe('003');
  });

  it('VALID: {folders: ["001-add-auth", "003-refactor"]} => returns "004"', () => {
    const result = questFolderSequenceTransformer({
      folders: [
        FolderNameStub({ value: '001-add-auth' }),
        FolderNameStub({ value: '003-refactor' }),
      ],
    });

    expect(result).toBe('004');
  });

  it('VALID: {folders: ["010-feature", "099-update"]} => returns "100"', () => {
    const result = questFolderSequenceTransformer({
      folders: [FolderNameStub({ value: '010-feature' }), FolderNameStub({ value: '099-update' })],
    });

    expect(result).toBe('100');
  });

  it('VALID: {folders: ["non-numbered-folder"]} => returns "001"', () => {
    const result = questFolderSequenceTransformer({
      folders: [FolderNameStub({ value: 'non-numbered-folder' })],
    });

    expect(result).toBe('001');
  });

  it('VALID: {folders: ["001-add-auth", "non-numbered", "002-fix-bug"]} => returns "003"', () => {
    const result = questFolderSequenceTransformer({
      folders: [
        FolderNameStub({ value: '001-add-auth' }),
        FolderNameStub({ value: 'non-numbered' }),
        FolderNameStub({ value: '002-fix-bug' }),
      ],
    });

    expect(result).toBe('003');
  });
});
