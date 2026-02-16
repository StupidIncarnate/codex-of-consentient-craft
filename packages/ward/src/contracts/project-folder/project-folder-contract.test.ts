import { projectFolderContract } from './project-folder-contract';
import { ProjectFolderStub } from './project-folder.stub';

describe('projectFolderContract', () => {
  describe('valid inputs', () => {
    it('VALID: {name and path} => parses successfully', () => {
      const result = projectFolderContract.parse(ProjectFolderStub());

      expect(result).toStrictEqual({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
    });

    it('VALID: {custom name and path} => parses successfully', () => {
      const result = projectFolderContract.parse({
        name: 'cli',
        path: '/home/user/project/packages/cli',
      });

      expect(result).toStrictEqual({
        name: 'cli',
        path: '/home/user/project/packages/cli',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_NAME: {name: number} => throws validation error', () => {
      expect(() =>
        projectFolderContract.parse({
          name: 123 as never,
          path: '/some/path',
        }),
      ).toThrow(/Expected string/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => projectFolderContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid project folder', () => {
      const result = ProjectFolderStub();

      expect(result).toStrictEqual({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
    });

    it('VALID: {custom values} => creates project folder with overrides', () => {
      const result = ProjectFolderStub({ name: 'cli', path: '/other/path' });

      expect(result).toStrictEqual({
        name: 'cli',
        path: '/other/path',
      });
    });
  });
});
