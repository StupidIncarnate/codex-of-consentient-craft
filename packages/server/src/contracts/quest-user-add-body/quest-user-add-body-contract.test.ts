import { questUserAddBodyContract } from './quest-user-add-body-contract';
import { QuestUserAddBodyStub } from './quest-user-add-body.stub';

describe('questUserAddBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: stub data => parses successfully', () => {
      const result = QuestUserAddBodyStub({});

      expect(result.title).toBe('Test Quest');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing title} => throws validation error', () => {
      expect(() => {
        questUserAddBodyContract.parse({ userRequest: 'x', guildId: 'abc' });
      }).toThrow(/Required/u);
    });
  });
});
