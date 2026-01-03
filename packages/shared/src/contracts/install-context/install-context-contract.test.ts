import { installContextContract } from './install-context-contract';
import { InstallContextStub as _InstallContextStub } from './install-context.stub';

describe('installContextContract', () => {
  describe('valid contexts', () => {
    it('VALID: {absolute paths} => parses successfully', () => {
      const result = installContextContract.parse({
        targetProjectRoot: '/home/user/project',
        dungeonmasterRoot: '/home/user/.dungeonmaster',
      });

      expect(result.targetProjectRoot).toBe('/home/user/project');
      expect(result.dungeonmasterRoot).toBe('/home/user/.dungeonmaster');
    });

    it('VALID: {relative paths} => parses successfully', () => {
      const result = installContextContract.parse({
        targetProjectRoot: './project',
        dungeonmasterRoot: '../dungeonmaster',
      });

      expect(result.targetProjectRoot).toBe('./project');
      expect(result.dungeonmasterRoot).toBe('../dungeonmaster');
    });

    it('VALID: {Windows paths} => parses successfully', () => {
      const result = installContextContract.parse({
        targetProjectRoot: 'C:\\Users\\project',
        dungeonmasterRoot: 'C:\\Users\\.dungeonmaster',
      });

      expect(result.targetProjectRoot).toBe('C:\\Users\\project');
      expect(result.dungeonmasterRoot).toBe('C:\\Users\\.dungeonmaster');
    });

    it('VALID: {mixed path types} => parses successfully', () => {
      const result = installContextContract.parse({
        targetProjectRoot: '/home/user/project',
        dungeonmasterRoot: './dungeonmaster',
      });

      expect(result.targetProjectRoot).toBe('/home/user/project');
      expect(result.dungeonmasterRoot).toBe('./dungeonmaster');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing targetProjectRoot} => throws ZodError', () => {
      expect(() => {
        return installContextContract.parse({
          dungeonmasterRoot: '/home/user/.dungeonmaster',
        });
      }).toThrow('Required');
    });

    it('INVALID: {missing dungeonmasterRoot} => throws ZodError', () => {
      expect(() => {
        return installContextContract.parse({
          targetProjectRoot: '/home/user/project',
        });
      }).toThrow('Required');
    });

    it('INVALID: {empty targetProjectRoot} => throws ZodError', () => {
      expect(() => {
        return installContextContract.parse({
          targetProjectRoot: '',
          dungeonmasterRoot: '/home/user/.dungeonmaster',
        });
      }).toThrow('String must contain at least 1 character');
    });

    it('INVALID: {empty dungeonmasterRoot} => throws ZodError', () => {
      expect(() => {
        return installContextContract.parse({
          targetProjectRoot: '/home/user/project',
          dungeonmasterRoot: '',
        });
      }).toThrow('String must contain at least 1 character');
    });

    it('INVALID: {invalid path format} => throws ZodError', () => {
      expect(() => {
        return installContextContract.parse({
          targetProjectRoot: 'invalid-path',
          dungeonmasterRoot: '/home/user/.dungeonmaster',
        });
      }).toThrow('Path must be absolute');
    });

    it('INVALID: {empty object} => throws ZodError', () => {
      expect(() => {
        return installContextContract.parse({});
      }).toThrow('Required');
    });
  });
});
