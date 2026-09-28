import { startArgsParseTransformer } from './start-args-parse-transformer';

describe('startArgsParseTransformer', () => {
  describe('the unowned case', () => {
    it('VALID: {--spec dungeonmaster-stack} => quest and guild null, isJson false', () => {
      const result = startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack'] });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        seed: null,
        isJson: false,
      });
    });
  });

  describe('every flag named', () => {
    it('VALID: {--spec, --quest, --guild} => returns the complete object with isJson false', () => {
      const result = startArgsParseTransformer({
        args: [
          '--spec',
          'dungeonmaster-stack',
          '--quest',
          'add-auth',
          '--guild',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        seed: null,
        isJson: false,
      });
    });
  });

  describe('--json is accepted and sets isJson true', () => {
    it('VALID: {--spec, --quest, --guild, --json} => returns object with isJson true', () => {
      const result = startArgsParseTransformer({
        args: [
          '--spec',
          'dungeonmaster-stack',
          '--quest',
          'add-auth',
          '--guild',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          '--json',
        ],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        seed: null,
        isJson: true,
      });
    });
  });

  describe('missing --spec', () => {
    it('INVALID: {args: []} => throws naming --spec as required and the known specs', () => {
      expect(() => startArgsParseTransformer({ args: [] })).toThrow(
        /^--spec is required: name the lane spec to boot\. Known specs: stack, api\.$/u,
      );
    });

    it('INVALID: {--quest and --guild but no --spec} => throws naming --spec as required and the known specs', () => {
      expect(() =>
        startArgsParseTransformer({ args: ['--quest', 'add-auth', '--guild', 'x'] }),
      ).toThrow(/^--spec is required: name the lane spec to boot\. Known specs: stack, api\.$/u);
    });
  });

  describe('an empty --spec', () => {
    it('INVALID: {--spec ""} => throws saying --spec must name a lane spec, and the known specs', () => {
      expect(() => startArgsParseTransformer({ args: ['--spec', ''] })).toThrow(
        /^--spec must name a lane spec; got ""\. Known specs: stack, api\.$/u,
      );
    });
  });

  describe('an empty --quest', () => {
    it('INVALID: {--quest ""} => throws naming --quest and questIdContract\'s own message', () => {
      expect(() =>
        startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack', '--quest', ''] }),
      ).toThrow(/^--quest: String must contain at least 1 character\(s\)$/u);
    });
  });

  describe('a badly-shaped --guild', () => {
    it("INVALID: {--guild not-a-uuid} => throws naming --guild and guildIdContract's own message", () => {
      expect(() =>
        startArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-stack', '--guild', 'not-a-uuid'],
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
      expect(() => startArgsParseTransformer({ args: ['dungeonmaster-stack'] })).toThrow(
        /^Unexpected positional argument: dungeonmaster-stack\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense start --spec <specName> \[--quest <questId>\] \[--guild <guildId>\] \[--seed <recipeName>\] \[--idle-timeout-ms <ms>\] \[--json\]$/u,
      );
    });
  });

  describe("--idle-timeout-ms raises the served lane's idle ceiling", () => {
    it('VALID: {--spec, --idle-timeout-ms 1800000} => returns idleTimeoutMs alongside the rest', () => {
      const result = startArgsParseTransformer({
        args: ['--spec', 'dungeonmaster-stack', '--idle-timeout-ms', '1800000'],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        seed: null,
        idleTimeoutMs: 1_800_000,
        isJson: false,
      });
    });

    it('VALID: {--spec only, no --idle-timeout-ms} => the key is absent, not null', () => {
      const result = startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack'] });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        seed: null,
        isJson: false,
      });
    });

    it('VALID: {--idle-timeout-ms 900000} => the default itself is accepted, the boundary is inclusive', () => {
      const result = startArgsParseTransformer({
        args: ['--spec', 'dungeonmaster-stack', '--idle-timeout-ms', '900000'],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        seed: null,
        idleTimeoutMs: 900_000,
        isJson: false,
      });
    });

    describe('a --idle-timeout-ms value the contract refuses', () => {
      it.each(['not-a-number', '-1'])(
        'INVALID: {--idle-timeout-ms %s} => refuses saying --idle-timeout-ms must be at least the 900000ms default, and what was typed',
        (idleTimeoutValue) => {
          expect(() =>
            startArgsParseTransformer({
              args: ['--spec', 'dungeonmaster-stack', '--idle-timeout-ms', idleTimeoutValue],
            }),
          ).toThrow(
            new RegExp(
              `^--idle-timeout-ms must be a whole number of 900000 \\(the default\\) or more — this flag only raises the ceiling; got "${idleTimeoutValue}"$`,
              'u',
            ),
          );
        },
      );
    });

    describe('a --idle-timeout-ms value below the default, that would LOWER the ceiling instead of raising it', () => {
      it('INVALID: {--idle-timeout-ms 1000} => refuses rather than booting a lane that reaps itself in 1 second', () => {
        expect(() =>
          startArgsParseTransformer({
            args: ['--spec', 'dungeonmaster-stack', '--idle-timeout-ms', '1000'],
          }),
        ).toThrow(
          /^--idle-timeout-ms must be a whole number of 900000 \(the default\) or more — this flag only raises the ceiling; got "1000"$/u,
        );
      });
    });
  });

  describe('--seed names a recipe to run once the lane is up', () => {
    it('VALID: {--spec, --seed guild-with-three-quests} => returns that recipe name', () => {
      const result = startArgsParseTransformer({
        args: ['--spec', 'dungeonmaster-stack', '--seed', 'guild-with-three-quests'],
      });

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        seed: 'guild-with-three-quests',
        isJson: false,
      });
    });

    it("INVALID: {--seed 'Not Kebab'} => throws naming the flag and the kebab rule", () => {
      expect(() =>
        startArgsParseTransformer({
          args: ['--spec', 'dungeonmaster-stack', '--seed', 'Not Kebab'],
        }),
      ).toThrow(/^--seed: Recipe name must be kebab-case/u);
    });
  });
});
