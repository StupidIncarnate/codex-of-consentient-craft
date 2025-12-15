import { pathJoinAdapter } from './path-join-adapter';
import { pathJoinAdapterProxy } from './path-join-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('pathJoinAdapter', () => {
  describe('valid path joins', () => {
    it('VALID: {paths: ["/project", "src", "file.ts"]} => returns "/project/src/file.ts"', () => {
      const proxy = pathJoinAdapterProxy();

      proxy.returns({ result: FilePathStub({ value: '/project/src/file.ts' }) });

      const result = pathJoinAdapter({ paths: ['/project', 'src', 'file.ts'] });

      expect(result).toBe('/project/src/file.ts');
    });

    it('VALID: {paths: ["/project", ".dungeonmaster"]} => returns "/project/.dungeonmaster"', () => {
      const proxy = pathJoinAdapterProxy();

      proxy.returns({ result: FilePathStub({ value: '/project/.dungeonmaster' }) });

      const result = pathJoinAdapter({ paths: ['/project', '.dungeonmaster'] });

      expect(result).toBe('/project/.dungeonmaster');
    });
  });
});
