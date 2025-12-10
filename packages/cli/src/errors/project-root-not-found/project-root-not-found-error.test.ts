import { ProjectRootNotFoundError } from './project-root-not-found-error';

describe('ProjectRootNotFoundError', () => {
  describe('constructor()', () => {
    it('VALID: {startPath: "/path/to/file.js"} => creates error with start path in message', () => {
      const error = new ProjectRootNotFoundError({ startPath: '/path/to/file.js' });

      expect(error.name).toBe('ProjectRootNotFoundError');
      expect(error.message).toBe(
        'No package.json found starting from /path/to/file.js. Searched up the directory tree but no project root was found.',
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProjectRootNotFoundError);
    });

    it('VALID: {startPath: "/home/user/project/src/file.ts"} => handles nested file paths', () => {
      const error = new ProjectRootNotFoundError({
        startPath: '/home/user/project/src/file.ts',
      });

      expect(error.message).toBe(
        'No package.json found starting from /home/user/project/src/file.ts. Searched up the directory tree but no project root was found.',
      );
      expect(error.name).toBe('ProjectRootNotFoundError');
    });

    it('EDGE: {startPath: ""} => handles empty start path', () => {
      const error = new ProjectRootNotFoundError({ startPath: '' });

      expect(error.message).toBe(
        'No package.json found starting from . Searched up the directory tree but no project root was found.',
      );
      expect(error.name).toBe('ProjectRootNotFoundError');
    });

    it('VALID: {startPath: "/"} => handles root path', () => {
      const error = new ProjectRootNotFoundError({ startPath: '/' });

      expect(error.message).toBe(
        'No package.json found starting from /. Searched up the directory tree but no project root was found.',
      );
      expect(error.name).toBe('ProjectRootNotFoundError');
    });
  });
});
