import { questNewBodyContract } from './quest-new-body-contract';
import { QuestNewBodyStub } from './quest-new-body.stub';

describe('questNewBodyContract', () => {
  describe('valid bodies', () => {
    it('VALID: {message} => parses with questType omitted', () => {
      const result = questNewBodyContract.parse({ message: 'Build the login flow' });

      expect(result).toStrictEqual({ message: 'Build the login flow' });
    });

    it('VALID: {message, questType: "bug-hunt"} => parses with questType', () => {
      const result = questNewBodyContract.parse(
        QuestNewBodyStub({ message: 'Rows do not render' as never, questType: 'bug-hunt' }),
      );

      expect(result).toStrictEqual({ message: 'Rows do not render', questType: 'bug-hunt' });
    });

    it('VALID: {message, questType: "feature"} => parses with questType', () => {
      const result = questNewBodyContract.parse(
        QuestNewBodyStub({ message: 'Add auth' as never, questType: 'feature' }),
      );

      expect(result).toStrictEqual({ message: 'Add auth', questType: 'feature' });
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {} (empty object) => throws Required error for message', () => {
      expect(() => questNewBodyContract.parse({})).toThrow(/message/u);
    });

    it('INVALID: {message: ""} (empty string) => throws min length error', () => {
      expect(() => questNewBodyContract.parse({ message: '' })).toThrow(
        /String must contain at least 1/u,
      );
    });

    it('INVALID: {message, questType: "bogus"} => throws Invalid enum value', () => {
      expect(() => questNewBodyContract.parse({ message: 'Add auth', questType: 'bogus' })).toThrow(
        /Invalid enum value/u,
      );
    });
  });
});
