import { startArgsContract } from './start-args-contract';
import { StartArgsStub } from './start-args.stub';

describe('startArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {specName, questId: null, guildId: null} => the unowned form parses', () => {
      const args = StartArgsStub({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
      });

      const result = startArgsContract.parse(args);

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        seed: null,
        isJson: false,
      });
    });

    it('VALID: {specName, questId, guildId} => the owned form parses', () => {
      const args = StartArgsStub({
        specName: 'dungeonmaster-stack',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      const result = startArgsContract.parse(args);

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        seed: null,
        isJson: false,
      });
    });

    it('VALID: {specName, questId: null, guildId: null, idleTimeoutMs: 1_800_000} => the raised ceiling parses', () => {
      const args = StartArgsStub({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        idleTimeoutMs: 1_800_000,
      });

      const result = startArgsContract.parse(args);

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        seed: null,
        idleTimeoutMs: 1_800_000,
        isJson: false,
      });
    });

    it('VALID: {seed} => the recipe name a boot-time seed names parses', () => {
      const result = startArgsContract.parse(
        StartArgsStub({ specName: 'dungeonmaster-stack', seed: 'guild-with-three-quests' }),
      );

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        seed: 'guild-with-three-quests',
        isJson: false,
      });
    });

    it('VALID: {isJson: true} => explicit json flag parses', () => {
      const result = startArgsContract.parse(
        StartArgsStub({ specName: 'dungeonmaster-stack', isJson: true }),
      );

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        questId: null,
        guildId: null,
        seed: null,
        isJson: true,
      });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {seed: "Not Kebab"} => throws naming the kebab rule', () => {
      expect(() =>
        startArgsContract.parse({
          specName: 'dungeonmaster-stack',
          questId: null,
          guildId: null,
          seed: 'Not Kebab',
        }),
      ).toThrow(/Recipe name must be kebab-case/u);
    });

    it('INVALID: {missing questId} => raises exactly one issue, scoped to questId, because .nullable() is not .optional()', () => {
      const result = startArgsContract.safeParse({
        specName: 'dungeonmaster-stack',
        guildId: null,
        seed: null,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['questId'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {missing guildId} => raises exactly one issue, scoped to guildId, because .nullable() is not .optional()', () => {
      const result = startArgsContract.safeParse({
        specName: 'dungeonmaster-stack',
        questId: null,
        seed: null,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['guildId'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "reason"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        startArgsContract.parse({
          specName: 'dungeonmaster-stack',
          questId: null,
          guildId: null,
          seed: null,
          reason: 'done testing',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
