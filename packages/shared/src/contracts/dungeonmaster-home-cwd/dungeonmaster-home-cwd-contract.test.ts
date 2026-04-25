import { dungeonmasterHomeCwdContract } from './dungeonmaster-home-cwd-contract';
import { DungeonmasterHomeCwdStub as _DungeonmasterHomeCwdStub } from './dungeonmaster-home-cwd.stub';

describe('dungeonmasterHomeCwdContract', () => {
  describe('valid absolute paths', () => {
    it('VALID: {path: "/home/user/.dungeonmaster"} => parses successfully', () => {
      const result = dungeonmasterHomeCwdContract.parse('/home/user/.dungeonmaster');

      expect(result).toBe('/home/user/.dungeonmaster');
    });

    it('VALID: {path: "/repo/.dungeonmaster-dev"} => parses successfully', () => {
      const result = dungeonmasterHomeCwdContract.parse('/repo/.dungeonmaster-dev');

      expect(result).toBe('/repo/.dungeonmaster-dev');
    });

    it('VALID: {path: "C:\\\\Users\\\\me\\\\.dungeonmaster"} => parses successfully', () => {
      const result = dungeonmasterHomeCwdContract.parse('C:\\Users\\me\\.dungeonmaster');

      expect(result).toBe('C:\\Users\\me\\.dungeonmaster');
    });
  });

  describe('invalid relative paths', () => {
    it('INVALID: {path: "./.dungeonmaster"} => throws validation error', () => {
      expect(() => {
        return dungeonmasterHomeCwdContract.parse('./.dungeonmaster');
      }).toThrow('Path must be absolute');
    });

    it('INVALID: {path: ".dungeonmaster"} => throws validation error', () => {
      expect(() => {
        return dungeonmasterHomeCwdContract.parse('.dungeonmaster');
      }).toThrow('Path must be absolute');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: ""} => throws ZodError', () => {
      expect(() => {
        return dungeonmasterHomeCwdContract.parse('');
      }).toThrow('String must contain at least 1 character');
    });

    it('INVALID: {path: 123} => throws ZodError', () => {
      expect(() => {
        return dungeonmasterHomeCwdContract.parse(123);
      }).toThrow('Expected string');
    });

    it('INVALID: {path: null} => throws ZodError', () => {
      expect(() => {
        return dungeonmasterHomeCwdContract.parse(null);
      }).toThrow('Expected string');
    });
  });
});
