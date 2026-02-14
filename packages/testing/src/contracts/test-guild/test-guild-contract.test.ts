import { testGuildContract } from './test-guild-contract';
import { TestGuildStub } from './test-guild.stub';

describe('testGuildContract', () => {
  describe('valid inputs', () => {
    it('VALID: {guildPath, guildName, rootDir} => parses all data properties', () => {
      const guild = TestGuildStub({
        guildPath: '/tmp/test-123',
        guildName: 'test-123',
        rootDir: '/tmp/test-123',
      });

      const parsed = testGuildContract.parse({
        guildPath: guild.guildPath,
        guildName: guild.guildName,
        rootDir: guild.rootDir,
      });

      expect(parsed).toStrictEqual({
        guildPath: '/tmp/test-123',
        guildName: 'test-123',
        rootDir: '/tmp/test-123',
      });
    });

    it('VALID: {with absolute paths} => parses absolute project paths', () => {
      const guild = TestGuildStub({
        guildPath: '/home/user/projects/test-project',
        guildName: 'test-project',
        rootDir: '/home/user/projects/test-project',
      });

      const parsed = testGuildContract.parse({
        guildPath: guild.guildPath,
        guildName: guild.guildName,
        rootDir: guild.rootDir,
      });

      expect(parsed).toStrictEqual({
        guildPath: '/home/user/projects/test-project',
        guildName: 'test-project',
        rootDir: '/home/user/projects/test-project',
      });
    });

    it('VALID: {with different rootDir} => parses when rootDir differs from guildPath', () => {
      const guild = TestGuildStub({
        guildPath: '/tmp/test-project-abc',
        guildName: 'test-project-abc',
        rootDir: '/tmp',
      });

      const parsed = testGuildContract.parse({
        guildPath: guild.guildPath,
        guildName: guild.guildName,
        rootDir: guild.rootDir,
      });

      expect(parsed).toStrictEqual({
        guildPath: '/tmp/test-project-abc',
        guildName: 'test-project-abc',
        rootDir: '/tmp',
      });
    });

    it('VALID: {stub defaults} => parses with default values from stub', () => {
      const guild = TestGuildStub();

      const parsed = testGuildContract.parse({
        guildPath: guild.guildPath,
        guildName: guild.guildName,
        rootDir: guild.rootDir,
      });

      expect(parsed).toStrictEqual({
        guildPath: '/tmp/test-guild-abc123',
        guildName: 'test-guild-abc123',
        rootDir: '/tmp/test-guild-abc123',
      });
    });

    it('EDGE: {guildName with special chars} => parses project name with hyphens', () => {
      const guild = TestGuildStub({
        guildPath: '/tmp/test-project-123-abc',
        guildName: 'test-project-123-abc',
        rootDir: '/tmp/test-project-123-abc',
      });

      const parsed = testGuildContract.parse({
        guildPath: guild.guildPath,
        guildName: guild.guildName,
        rootDir: guild.rootDir,
      });

      expect(parsed).toStrictEqual({
        guildPath: '/tmp/test-project-123-abc',
        guildName: 'test-project-123-abc',
        rootDir: '/tmp/test-project-123-abc',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_PROJECT_PATH: {guildPath: 123} => throws validation error for non-string', () => {
      expect(() => {
        return testGuildContract.parse({
          guildPath: 123 as never,
          guildName: 'test',
          rootDir: '/tmp',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_PROJECT_PATH: {guildPath: null} => throws validation error for null', () => {
      expect(() => {
        return testGuildContract.parse({
          guildPath: null as never,
          guildName: 'test',
          rootDir: '/tmp',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_PROJECT_NAME: {guildName: 123} => throws validation error for non-string', () => {
      expect(() => {
        return testGuildContract.parse({
          guildPath: '/tmp/test',
          guildName: 123 as never,
          rootDir: '/tmp',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_ROOT_DIR: {rootDir: []} => throws validation error for array', () => {
      expect(() => {
        return testGuildContract.parse({
          guildPath: '/tmp/test',
          guildName: 'test',
          rootDir: [] as never,
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_MULTIPLE: {missing guildPath and guildName} => throws validation error', () => {
      expect(() => {
        return testGuildContract.parse({
          rootDir: '/tmp',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error for empty object', () => {
      expect(() => {
        return testGuildContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {only guildPath} => throws validation error for missing fields', () => {
      expect(() => {
        return testGuildContract.parse({
          guildPath: '/tmp/test',
        });
      }).toThrow(/Required/u);
    });
  });
});
