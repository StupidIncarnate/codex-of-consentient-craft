import { startArgsParseTransformer } from './start-args-parse-transformer';

describe('startArgsParseTransformer', () => {
  describe('the unowned case', () => {
    it('VALID: {--spec dungeonmaster-web} => quest and guild null', () => {
      const result = startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-web'] });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-web',
        questId: null,
        guildId: null,
        seed: null,
      });
    });
  });

  describe('every flag named', () => {
    it('VALID: {--spec, --quest, --guild} => returns the complete object', () => {
      const result = startArgsParseTransformer({
        args: [
          '--spec',
          'dungeonmaster-web',
          '--quest',
          'add-auth',
          '--guild',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-web',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        seed: null,
      });
    });
  });

  describe('--json is accepted as an explicit affirmation of the default', () => {
    it('VALID: {--spec, --quest, --guild, --json} => the same object --json contributes no field to', () => {
      const result = startArgsParseTransformer({
        args: [
          '--spec',
          'dungeonmaster-web',
          '--quest',
          'add-auth',
          '--guild',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          '--json',
        ],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-web',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        seed: null,
      });
    });
  });

  describe('missing --spec', () => {
    it('INVALID: {args: []} => throws naming --spec as required', () => {
      expect(() => startArgsParseTransformer({ args: [] })).toThrow(
        /^--spec is required: name the lane spec to boot\.$/u,
      );
    });

    it('INVALID: {--quest and --guild but no --spec} => throws naming --spec as required', () => {
      expect(() =>
        startArgsParseTransformer({ args: ['--quest', 'add-auth', '--guild', 'x'] }),
      ).toThrow(/^--spec is required: name the lane spec to boot\.$/u);
    });
  });

  describe('an empty --spec', () => {
    it('INVALID: {--spec ""} => throws naming --spec and specNameContract\'s own message', () => {
      expect(() => startArgsParseTransformer({ args: ['--spec', ''] })).toThrow(
        /^--spec: String must contain at least 1 character\(s\)$/u,
      );
    });
  });

  describe('an empty --quest', () => {
    it('INVALID: {--quest ""} => throws naming --quest and questIdContract\'s own message', () => {
      expect(() =>
        startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-web', '--quest', ''] }),
      ).toThrow(/^--quest: String must contain at least 1 character\(s\)$/u);
    });
  });

  describe('a badly-shaped --guild', () => {
    it("INVALID: {--guild not-a-uuid} => throws naming --guild and guildIdContract's own message", () => {
      expect(() =>
        startArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-web', '--guild', 'not-a-uuid'],
        }),
      ).toThrow(/^--guild: Invalid uuid$/u);
    });
  });

  describe('unknown flag', () => {
    it('INVALID: {--bogus X} => throws naming the flag and listing the accepted ones', () => {
      expect(() => startArgsParseTransformer({ args: ['--bogus', 'X'] })).toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --spec, --quest, --guild, --idle-timeout-ms, --seed, --json\n\nUsage: dungeonmaster siegelense start --spec <specName> \[--quest <questId>\] \[--guild <guildId>\] \[--seed <recipeName>\] \[--idle-timeout-ms <ms>\] \[--json\]$/u,
      );
    });
  });

  describe('positional argument', () => {
    it('INVALID: {a bare token} => throws naming it', () => {
      expect(() => startArgsParseTransformer({ args: ['dungeonmaster-web'] })).toThrow(
        /^Unexpected positional argument: dungeonmaster-web\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense start --spec <specName> \[--quest <questId>\] \[--guild <guildId>\] \[--seed <recipeName>\] \[--idle-timeout-ms <ms>\] \[--json\]$/u,
      );
    });
  });

  describe("--idle-timeout-ms raises the served lane's idle ceiling", () => {
    it('VALID: {--spec, --idle-timeout-ms 1800000} => returns idleTimeoutMs alongside the rest', () => {
      const result = startArgsParseTransformer({
        args: ['--spec', 'dungeonmaster-web', '--idle-timeout-ms', '1800000'],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-web',
        questId: null,
        guildId: null,
        seed: null,
        idleTimeoutMs: 1_800_000,
      });
    });

    it('VALID: {--spec only, no --idle-timeout-ms} => the key is absent, not null', () => {
      const result = startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-web'] });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-web',
        questId: null,
        guildId: null,
        seed: null,
      });
    });

    it('INVALID: {--idle-timeout-ms not-a-number} => throws naming --idle-timeout-ms', () => {
      expect(() =>
        startArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-web', '--idle-timeout-ms', 'not-a-number'],
        }),
      ).toThrow(/^--idle-timeout-ms: Expected number, received nan$/u);
    });

    it("INVALID: {--idle-timeout-ms -1} => throws naming --idle-timeout-ms and the contract's own message", () => {
      expect(() =>
        startArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-web', '--idle-timeout-ms', '-1'],
        }),
      ).toThrow(/^--idle-timeout-ms: Number must be greater than or equal to 0$/u);
    });
  });

  describe('--seed names a recipe to run once the lane is up', () => {
    it('VALID: {--spec, --seed guild-with-three-quests} => returns that recipe name', () => {
      const result = startArgsParseTransformer({
        args: ['--spec', 'dungeonmaster-web', '--seed', 'guild-with-three-quests'],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-web',
        questId: null,
        guildId: null,
        seed: 'guild-with-three-quests',
      });
    });

    it("INVALID: {--seed 'Not Kebab'} => throws naming the flag and the kebab rule", () => {
      expect(() =>
        startArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-web', '--seed', 'Not Kebab'],
        }),
      ).toThrow(/^--seed: Recipe name must be kebab-case/u);
    });
  });
});
