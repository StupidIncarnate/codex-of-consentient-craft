import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { guildIdParamsContract } from './guild-id-params-contract';
import { GuildIdParamsStub } from './guild-id-params.stub';

describe('guildIdParamsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {guildId: uuid} => parses successfully', () => {
      const guildId = GuildIdStub();
      const result = GuildIdParamsStub({ guildId });

      expect(result.guildId).toBe(guildId);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing guildId} => throws validation error', () => {
      expect(() => {
        guildIdParamsContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {guildId: not-a-uuid} => throws validation error', () => {
      expect(() => {
        guildIdParamsContract.parse({ guildId: 'not-a-uuid' });
      }).toThrow(/uuid/u);
    });
  });
});
