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

    it('VALID: {paths: ["/project", ".claude"]} => returns "/project/.claude"', () => {
      const proxy = pathJoinAdapterProxy();

      proxy.returns({ result: FilePathStub({ value: '/project/.claude' }) });

      const result = pathJoinAdapter({ paths: ['/project', '.claude'] });

      expect(result).toBe('/project/.claude');
    });

    it('VALID: {paths: ["/project", "package.json"]} => returns "/project/package.json"', () => {
      const proxy = pathJoinAdapterProxy();

      proxy.returns({ result: FilePathStub({ value: '/project/package.json' }) });

      const result = pathJoinAdapter({ paths: ['/project', 'package.json'] });

      expect(result).toBe('/project/package.json');
    });
  });
});
