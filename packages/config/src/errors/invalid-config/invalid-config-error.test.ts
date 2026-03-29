import { InvalidConfigError } from './invalid-config-error';

describe('InvalidConfigError', () => {
  describe('constructor()', () => {
    it('VALID: {message: "test error"} => creates error without config path', () => {
      const error = new InvalidConfigError({ message: 'test error' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidConfigError',
        message: 'Invalid configuration: test error',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InvalidConfigError);
    });

    it('VALID: {message: "test error", configPath: "/path/config"} => creates error with config path', () => {
      const error = new InvalidConfigError({
        message: 'test error',
        configPath: '/path/config',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidConfigError',
        message: 'Invalid configuration in /path/config: test error',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InvalidConfigError);
    });

    it('EDGE: {message: ""} => handles empty message', () => {
      const error = new InvalidConfigError({ message: '' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidConfigError',
        message: 'Invalid configuration: ',
      });
    });

    it('EDGE: {message: "test", configPath: ""} => handles empty config path', () => {
      const error = new InvalidConfigError({
        message: 'test',
        configPath: '',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidConfigError',
        message: 'Invalid configuration: test',
      });
    });

    it('VALID: {message: "complex message with\nnewlines"} => handles multiline messages', () => {
      const error = new InvalidConfigError({
        message: 'complex message with\nnewlines',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidConfigError',
        message: 'Invalid configuration: complex message with\nnewlines',
      });
    });

    it('VALID: {message: "test", configPath: "/very/long/path/to/config/.dungeonmaster"} => handles long paths', () => {
      const error = new InvalidConfigError({
        message: 'test',
        configPath: '/very/long/path/to/config/.dungeonmaster',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'InvalidConfigError',
        message: 'Invalid configuration in /very/long/path/to/config/.dungeonmaster: test',
      });
    });
  });
});
