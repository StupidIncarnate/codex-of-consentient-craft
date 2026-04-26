import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { guildIdQueryContract } from './guild-id-query-contract';
import { GuildIdQueryStub } from './guild-id-query.stub';

describe('guildIdQueryContract', () => {
  describe('valid inputs', () => {
    it('VALID: {guildId: uuid} => parses successfully', () => {
      const guildId = GuildIdStub();
      const result = GuildIdQueryStub({ guildId });

      expect(result.guildId).toBe(guildId);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing guildId} => throws validation error', () => {
      expect(() => {
        guildIdQueryContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {guildId: not-a-uuid} => throws validation error', () => {
      expect(() => {
        guildIdQueryContract.parse({ guildId: 'not-a-uuid' });
      }).toThrow(/uuid/u);
    });
  });
});
