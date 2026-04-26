import { guildUpdateBodyContract } from './guild-update-body-contract';
import { GuildUpdateBodyStub } from './guild-update-body.stub';

describe('guildUpdateBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: empty object => parses successfully', () => {
      const result = GuildUpdateBodyStub({});

      expect(result.name).toBe(undefined);
    });

    it('VALID: {name} => parses successfully', () => {
      const result = guildUpdateBodyContract.parse({ name: 'New Guild' });

      expect(result.name).toBe('New Guild');
    });
  });
});
