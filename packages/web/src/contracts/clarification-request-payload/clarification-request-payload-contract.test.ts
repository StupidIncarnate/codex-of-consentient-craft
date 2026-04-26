import { clarificationRequestPayloadContract } from './clarification-request-payload-contract';
import { ClarificationRequestPayloadStub } from './clarification-request-payload.stub';

describe('clarificationRequestPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {chatProcessId, questions} => parses successfully', () => {
      const payload = ClarificationRequestPayloadStub();

      const result = clarificationRequestPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        questions: [],
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing chatProcessId} => throws validation error', () => {
      expect(() => {
        clarificationRequestPayloadContract.parse({ questions: [] });
      }).toThrow(/Required/u);
    });
  });
});
