import { directoryBrowseBodyContract } from './directory-browse-body-contract';
import { DirectoryBrowseBodyStub } from './directory-browse-body.stub';

describe('directoryBrowseBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {} => parses to empty body', () => {
      const result = DirectoryBrowseBodyStub({});

      expect(result.path).toBe(undefined);
    });

    it('VALID: {path: "/abs/path"} => parses with path', () => {
      const result = directoryBrowseBodyContract.parse({ path: '/abs/path' });

      expect(result.path).toBe('/abs/path');
    });
  });
});
