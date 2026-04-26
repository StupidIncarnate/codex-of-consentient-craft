import { guildAddBodyContract } from './guild-add-body-contract';
import { GuildAddBodyStub } from './guild-add-body.stub';

describe('guildAddBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: stub data => parses successfully', () => {
      const result = GuildAddBodyStub({});

      expect(result.name).toBe('My Guild');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing path} => throws validation error', () => {
      expect(() => {
        guildAddBodyContract.parse({ name: 'g' });
      }).toThrow(/Required/u);
    });
  });
});
