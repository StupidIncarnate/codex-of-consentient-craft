import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { guildIdBodyContract } from './guild-id-body-contract';
import { GuildIdBodyStub } from './guild-id-body.stub';

describe('guildIdBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {guildId: uuid} => parses successfully', () => {
      const guildId = GuildIdStub();
      const result = GuildIdBodyStub({ guildId });

      expect(result.guildId).toBe(guildId);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing guildId} => throws validation error', () => {
      expect(() => {
        guildIdBodyContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
