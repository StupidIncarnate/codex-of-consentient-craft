import { questStartResponseContract } from './quest-start-response-contract';
import { QuestStartResponseStub } from './quest-start-response.stub';

describe('questStartResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {processId} => parses successfully', () => {
      const response = QuestStartResponseStub();

      const result = questStartResponseContract.parse(response);

      expect(result).toStrictEqual({
        processId: 'proc-12345',
      });
    });

    it('VALID: {custom processId} => parses with override', () => {
      const response = QuestStartResponseStub({ processId: 'proc-99999' as never });

      const result = questStartResponseContract.parse(response);

      expect(result).toStrictEqual({
        processId: 'proc-99999',
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID_PROCESS_ID: {missing processId} => throws validation error', () => {
      expect(() => {
        questStartResponseContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_PROCESS_ID: {empty processId} => throws validation error', () => {
      expect(() => {
        questStartResponseContract.parse({ processId: '' });
      }).toThrow(/too_small/u);
    });
  });
});
