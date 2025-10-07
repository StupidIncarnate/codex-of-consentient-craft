import { InvalidConfigError } from './invalid-config-error';

describe('InvalidConfigError', () => {
  describe('constructor()', () => {
    it('VALID: {message: "test error"} => creates error without config path', () => {
      const error = new InvalidConfigError({ message: 'test error' });

      expect(error).toStrictEqual(
        expect.objectContaining({
          name: 'InvalidConfigError',
          message: 'Invalid configuration: test error',
        }),
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InvalidConfigError);
    });

    it('VALID: {message: "test error", configPath: "/path/config"} => creates error with config path', () => {
      const error = new InvalidConfigError({
        message: 'test error',
        configPath: '/path/config',
      });

      expect(error).toStrictEqual(
        expect.objectContaining({
          name: 'InvalidConfigError',
          message: 'Invalid configuration in /path/config: test error',
        }),
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InvalidConfigError);
    });

    it('EDGE: {message: ""} => handles empty message', () => {
      const error = new InvalidConfigError({ message: '' });

      expect(error.message).toBe('Invalid configuration: ');
      expect(error.name).toBe('InvalidConfigError');
    });

    it('EDGE: {message: "test", configPath: ""} => handles empty config path', () => {
      const error = new InvalidConfigError({
        message: 'test',
        configPath: '',
      });

      expect(error.message).toBe('Invalid configuration: test');
      expect(error.name).toBe('InvalidConfigError');
    });

    it('VALID: {message: "complex message with\nnewlines"} => handles multiline messages', () => {
      const error = new InvalidConfigError({
        message: 'complex message with\nnewlines',
      });

      expect(error.message).toBe('Invalid configuration: complex message with\nnewlines');
      expect(error.name).toBe('InvalidConfigError');
    });

    it('VALID: {message: "test", configPath: "/very/long/path/to/config/.questmaestro"} => handles long paths', () => {
      const error = new InvalidConfigError({
        message: 'test',
        configPath: '/very/long/path/to/config/.questmaestro',
      });

      expect(error.message).toBe(
        'Invalid configuration in /very/long/path/to/config/.questmaestro: test',
      );
      expect(error.name).toBe('InvalidConfigError');
    });
  });
});
