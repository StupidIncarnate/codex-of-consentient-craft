import { startArgsContract } from './start-args-contract';
import { StartArgsStub } from './start-args.stub';

describe('startArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {specName, questId: null, guildId: null} => the unowned form parses', () => {
      const args = StartArgsStub({
        specName: 'dungeonmaster-web',
        questId: null,
        guildId: null,
      });

      const result = startArgsContract.parse(args);

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-web',
        questId: null,
        guildId: null,
      });
    });

    it('VALID: {specName, questId, guildId} => the owned form parses', () => {
      const args = StartArgsStub({
        specName: 'dungeonmaster-web',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      const result = startArgsContract.parse(args);

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-web',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing questId} => raises exactly one issue, scoped to questId, because .nullable() is not .optional()', () => {
      const result = startArgsContract.safeParse({
        specName: 'dungeonmaster-web',
        guildId: null,
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
        specName: 'dungeonmaster-web',
        questId: null,
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
          specName: 'dungeonmaster-web',
          questId: null,
          guildId: null,
          reason: 'done testing',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
