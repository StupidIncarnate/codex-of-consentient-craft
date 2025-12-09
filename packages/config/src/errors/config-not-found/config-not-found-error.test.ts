import { ConfigNotFoundError } from './config-not-found-error';

describe('ConfigNotFoundError', () => {
  describe('constructor()', () => {
    it('VALID: {startPath: "/path/to/file.js"} => creates error with start path in message', () => {
      const error = new ConfigNotFoundError({ startPath: '/path/to/file.js' });

      expect(error.name).toBe('ConfigNotFoundError');
      expect(error.message).toBe(
        'No .dungeonmaster configuration file found starting from /path/to/file.js. Searched up the directory tree but no config file was found.',
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ConfigNotFoundError);
    });

    it('VALID: {startPath: "/home/user/project/src/widgets/component.tsx"} => handles nested file paths', () => {
      const error = new ConfigNotFoundError({
        startPath: '/home/user/project/src/widgets/component.tsx',
      });

      expect(error.message).toBe(
        'No .dungeonmaster configuration file found starting from /home/user/project/src/widgets/component.tsx. Searched up the directory tree but no config file was found.',
      );
      expect(error.name).toBe('ConfigNotFoundError');
    });

    it('EDGE: {startPath: ""} => handles empty start path', () => {
      const error = new ConfigNotFoundError({ startPath: '' });

      expect(error.message).toBe(
        'No .dungeonmaster configuration file found starting from . Searched up the directory tree but no config file was found.',
      );
      expect(error.name).toBe('ConfigNotFoundError');
    });

    it('VALID: {startPath: "/"} => handles root path', () => {
      const error = new ConfigNotFoundError({ startPath: '/' });

      expect(error.message).toBe(
        'No .dungeonmaster configuration file found starting from /. Searched up the directory tree but no config file was found.',
      );
      expect(error.name).toBe('ConfigNotFoundError');
    });

    it('VALID: {startPath: "relative/path.js"} => handles relative paths', () => {
      const error = new ConfigNotFoundError({ startPath: 'relative/path.js' });

      expect(error.message).toBe(
        'No .dungeonmaster configuration file found starting from relative/path.js. Searched up the directory tree but no config file was found.',
      );
      expect(error.name).toBe('ConfigNotFoundError');
    });

    it('VALID: {startPath: "/path/with spaces/file.js"} => handles paths with spaces', () => {
      const error = new ConfigNotFoundError({ startPath: '/path/with spaces/file.js' });

      expect(error.message).toBe(
        'No .dungeonmaster configuration file found starting from /path/with spaces/file.js. Searched up the directory tree but no config file was found.',
      );
      expect(error.name).toBe('ConfigNotFoundError');
    });
  });
});
