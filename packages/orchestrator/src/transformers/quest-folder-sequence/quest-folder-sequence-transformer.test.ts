import { FileNameStub } from '../../contracts/file-name/file-name.stub';
import { questFolderSequenceTransformer } from './quest-folder-sequence-transformer';

describe('questFolderSequenceTransformer', () => {
  it('VALID: {empty folders} => returns "001"', () => {
    const result = questFolderSequenceTransformer({ folders: [] });

    expect(result).toBe('001');
  });

  it('VALID: {one folder} => returns next sequence', () => {
    const result = questFolderSequenceTransformer({
      folders: [FileNameStub({ value: '001-add-auth' })],
    });

    expect(result).toBe('002');
  });

  it('VALID: {multiple folders} => returns next after highest', () => {
    const result = questFolderSequenceTransformer({
      folders: [FileNameStub({ value: '001-add-auth' }), FileNameStub({ value: '002-fix-bug' })],
    });

    expect(result).toBe('003');
  });

  it('VALID: {gap in sequences} => returns next after highest', () => {
    const result = questFolderSequenceTransformer({
      folders: [FileNameStub({ value: '001-add-auth' }), FileNameStub({ value: '005-fix-bug' })],
    });

    expect(result).toBe('006');
  });

  it('EDGE: {non-numeric folder names} => ignores non-matching', () => {
    const result = questFolderSequenceTransformer({
      folders: [
        FileNameStub({ value: 'README.md' }),
        FileNameStub({ value: '001-add-auth' }),
        FileNameStub({ value: 'closed' }),
      ],
    });

    expect(result).toBe('002');
  });
});
