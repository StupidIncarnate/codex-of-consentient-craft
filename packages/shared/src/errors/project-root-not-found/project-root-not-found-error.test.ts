import { ProjectRootNotFoundError } from './project-root-not-found-error';

describe('ProjectRootNotFoundError', () => {
  describe('constructor()', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => creates error with descriptive message', () => {
      const error = new ProjectRootNotFoundError({ startPath: '/project/src/file.ts' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'ProjectRootNotFoundError',
        message:
          'No package.json found starting from /project/src/file.ts. Searched up the directory tree but no project root was found.',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProjectRootNotFoundError);
    });

    it('VALID: {startPath: "/deep/nested/path/file.ts"} => creates error with correct path in message', () => {
      const error = new ProjectRootNotFoundError({ startPath: '/deep/nested/path/file.ts' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'ProjectRootNotFoundError',
        message:
          'No package.json found starting from /deep/nested/path/file.ts. Searched up the directory tree but no project root was found.',
      });
    });

    it('EDGE: {startPath: "/"} => handles root path', () => {
      const error = new ProjectRootNotFoundError({ startPath: '/' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'ProjectRootNotFoundError',
        message:
          'No package.json found starting from /. Searched up the directory tree but no project root was found.',
      });
    });

    it('EDGE: {startPath: "/path with spaces/file.ts"} => handles paths with spaces', () => {
      const error = new ProjectRootNotFoundError({ startPath: '/path with spaces/file.ts' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'ProjectRootNotFoundError',
        message:
          'No package.json found starting from /path with spaces/file.ts. Searched up the directory tree but no project root was found.',
      });
    });
  });

  describe('inheritance', () => {
    it('VALID: error is instanceof Error and ProjectRootNotFoundError', () => {
      const error = new ProjectRootNotFoundError({ startPath: '/path/to/file.ts' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProjectRootNotFoundError);
    });
  });
});
