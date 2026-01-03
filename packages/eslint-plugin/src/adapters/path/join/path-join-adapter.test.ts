import { pathJoinAdapter } from './path-join-adapter';
import { pathJoinAdapterProxy } from './path-join-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('pathJoinAdapter', () => {
  describe('successful operations', () => {
    it('VALID: {paths: ["/project", "eslint.config.js"]} => returns joined path', () => {
      const proxy = pathJoinAdapterProxy();
      const paths = ['/project', 'eslint.config.js'];
      const expectedResult = FilePathStub({ value: '/project/eslint.config.js' });

      proxy.returns({ result: expectedResult });

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {paths: ["/home", "user", "project"]} => returns joined path', () => {
      const proxy = pathJoinAdapterProxy();
      const paths = ['/home', 'user', 'project'];
      const expectedResult = FilePathStub({ value: '/home/user/project' });

      proxy.returns({ result: expectedResult });

      const result = pathJoinAdapter({ paths });

      expect(result).toStrictEqual(expectedResult);
    });
  });
});
