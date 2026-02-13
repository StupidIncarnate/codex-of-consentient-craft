import { directoryEntryContract } from './directory-entry-contract';
import { DirectoryEntryStub } from './directory-entry.stub';

describe('directoryEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: directory entry => parses successfully', () => {
      const entry = DirectoryEntryStub();

      const result = directoryEntryContract.parse(entry);

      expect(result).toStrictEqual({
        name: 'my-folder',
        path: '/home/user/my-folder',
        isDirectory: true,
      });
    });

    it('VALID: file entry => parses successfully', () => {
      const entry = DirectoryEntryStub({
        name: 'readme.md',
        path: '/home/user/readme.md',
        isDirectory: false,
      });

      const result = directoryEntryContract.parse(entry);

      expect(result).toStrictEqual({
        name: 'readme.md',
        path: '/home/user/readme.md',
        isDirectory: false,
      });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        directoryEntryContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: empty name => throws validation error', () => {
      const baseEntry = DirectoryEntryStub();

      expect(() => {
        directoryEntryContract.parse({
          ...baseEntry,
          name: '',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
