import { clarificationRequestPayloadContract } from './clarification-request-payload-contract';
import { ClarificationRequestPayloadStub } from './clarification-request-payload.stub';

describe('clarificationRequestPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {chatProcessId, questions} => parses successfully', () => {
      const payload = ClarificationRequestPayloadStub();

      const result = clarificationRequestPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        questions: [
          {
            question: 'Which option do you prefer?',
            header: 'Preference',
            options: [{ label: 'Option A', description: 'First option' }],
            multiSelect: false,
          },
        ],
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing chatProcessId} => throws validation error', () => {
      expect(() => {
        clarificationRequestPayloadContract.parse({
          questions: ClarificationRequestPayloadStub().questions,
        });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {questions: []} => throws validation error', () => {
      expect(() => {
        clarificationRequestPayloadContract.parse({ chatProcessId: 'proc-12345', questions: [] });
      }).toThrow(/too_small/u);
    });
  });
});
