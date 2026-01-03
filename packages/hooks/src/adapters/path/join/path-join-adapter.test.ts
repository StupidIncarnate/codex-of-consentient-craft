import { pathJoinAdapter } from './path-join-adapter';
import { pathJoinAdapterProxy } from './path-join-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('pathJoinAdapter', () => {
  describe('join()', () => {
    it('VALID: joins path segments => returns FilePath', () => {
      const proxy = pathJoinAdapterProxy();

      const expectedPath = FilePathStub({ value: '/project/.claude/settings.json' });

      proxy.returns({ result: expectedPath });

      const result = pathJoinAdapter({ paths: ['/project', '.claude', 'settings.json'] });

      expect(result).toBe(expectedPath);
    });

    it('VALID: joins single segment => returns FilePath', () => {
      const proxy = pathJoinAdapterProxy();

      const expectedPath = FilePathStub({ value: '/project' });

      proxy.returns({ result: expectedPath });

      const result = pathJoinAdapter({ paths: ['/project'] });

      expect(result).toBe(expectedPath);
    });
  });
});
