import { pathJoinAdapter } from './path-join-adapter';
import { pathJoinAdapterProxy } from './path-join-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('pathJoinAdapter', () => {
  describe('valid joins', () => {
    it('VALID: {paths: ["/tmp", "test"]} => returns "/tmp/test"', () => {
      pathJoinAdapterProxy();
      const paths = ['/tmp', 'test'];

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(FilePathStub({ value: '/tmp/test' }));
    });

    it('VALID: {paths: ["/tmp", "dir", "file.txt"]} => returns "/tmp/dir/file.txt"', () => {
      pathJoinAdapterProxy();
      const paths = ['/tmp', 'dir', 'file.txt'];

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(FilePathStub({ value: '/tmp/dir/file.txt' }));
    });

    it('VALID: {paths: ["/"]} => returns "/"', () => {
      pathJoinAdapterProxy();
      const paths = ['/'];

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(FilePathStub({ value: '/' }));
    });
  });
});
