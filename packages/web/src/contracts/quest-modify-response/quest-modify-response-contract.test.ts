import { questModifyResponseContract } from './quest-modify-response-contract';
import { QuestModifyResponseStub } from './quest-modify-response.stub';

describe('questModifyResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {success: true} => parses successfully', () => {
      const response = QuestModifyResponseStub();

      const result = questModifyResponseContract.parse(response);

      expect(result).toStrictEqual({
        success: true,
      });
    });

    it('VALID: {success: false, error: msg} => parses successfully', () => {
      const response = QuestModifyResponseStub({
        value: { success: false, error: 'boom' as never },
      });

      const result = questModifyResponseContract.parse(response);

      expect(result).toStrictEqual({
        success: false,
        error: 'boom',
      });
    });

    it('VALID: {success: false, no error} => parses successfully', () => {
      const result = questModifyResponseContract.parse({ success: false });

      expect(result).toStrictEqual({
        success: false,
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {missing success} => throws validation error', () => {
      expect(() => {
        questModifyResponseContract.parse({});
      }).toThrow(/invalid_union/u);
    });
  });
});
