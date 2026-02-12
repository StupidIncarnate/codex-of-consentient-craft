import { questVerifyCheckContract } from './quest-verify-check-contract';
import { QuestVerifyCheckStub } from './quest-verify-check.stub';

describe('questVerifyCheckContract', () => {
  describe('valid checks', () => {
    it('VALID: {name, passed: true} => parses successfully', () => {
      const check = QuestVerifyCheckStub();

      const result = questVerifyCheckContract.parse(check);

      expect(result).toStrictEqual({
        name: 'dependency-graph',
        passed: true,
      });
    });

    it('VALID: {name, passed: false, message} => parses with message', () => {
      const check = QuestVerifyCheckStub({
        passed: false,
        message: 'Missing dependency' as never,
      });

      const result = questVerifyCheckContract.parse(check);

      expect(result).toStrictEqual({
        name: 'dependency-graph',
        passed: false,
        message: 'Missing dependency',
      });
    });
  });

  describe('invalid checks', () => {
    it('INVALID_NAME: {missing name} => throws validation error', () => {
      expect(() => {
        questVerifyCheckContract.parse({ passed: true });
      }).toThrow(/Required/u);
    });

    it('INVALID_PASSED: {missing passed} => throws validation error', () => {
      expect(() => {
        questVerifyCheckContract.parse({ name: 'test' });
      }).toThrow(/Required/u);
    });
  });
});
