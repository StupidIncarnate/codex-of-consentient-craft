import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { guildMessageBodyContract } from './guild-message-body-contract';
import { GuildMessageBodyStub } from './guild-message-body.stub';

describe('guildMessageBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {guildId, message: "hi"} => parses successfully', () => {
      const guildId = GuildIdStub();
      const result = GuildMessageBodyStub({ guildId, message: 'hi' });

      expect(result.message).toBe('hi');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing message} => throws validation error', () => {
      expect(() => {
        guildMessageBodyContract.parse({ guildId: GuildIdStub() });
      }).toThrow(/Required/u);
    });
  });
});
