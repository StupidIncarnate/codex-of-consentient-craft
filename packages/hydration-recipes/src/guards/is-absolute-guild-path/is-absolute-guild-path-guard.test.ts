import { isAbsoluteGuildPathGuard } from './is-absolute-guild-path-guard';
import { GuildPathStub } from '@dungeonmaster/shared/contracts';

describe('isAbsoluteGuildPathGuard', () => {
  describe('absolute paths', () => {
    it('VALID: {path: "/tmp/guild-1"} => returns true', () => {
      const result = isAbsoluteGuildPathGuard({ path: GuildPathStub({ value: '/tmp/guild-1' }) });

      expect(result).toBe(true);
    });

    it('VALID: {path: "C:\\\\guilds\\\\guild-1"} => returns true', () => {
      const result = isAbsoluteGuildPathGuard({
        path: GuildPathStub({ value: 'C:\\guilds\\guild-1' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('relative paths', () => {
    it('INVALID: {path: "guilds-under-test/guild-1"} => returns false', () => {
      const result = isAbsoluteGuildPathGuard({
        path: GuildPathStub({ value: 'guilds-under-test/guild-1' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {} => returns false', () => {
      const result = isAbsoluteGuildPathGuard({});

      expect(result).toBe(false);
    });
  });
});
