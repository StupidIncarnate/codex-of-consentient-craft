import { devLogEventPayloadContract } from './dev-log-event-payload-contract';
import { DevLogEventPayloadStub } from './dev-log-event-payload.stub';

describe('devLogEventPayloadContract', () => {
  describe('valid inputs', () => {
    it('VALID: empty object => parses successfully', () => {
      const result = DevLogEventPayloadStub({});

      expect(result.processId).toBe(undefined);
    });

    it('VALID: full shape => parses successfully', () => {
      const result = devLogEventPayloadContract.parse({
        chatProcessId: 'proc-1',
        questId: 'quest-1',
        slotIndex: 0,
        role: 'codeweaver',
      });

      expect(result.role).toBe('codeweaver');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {chatProcessId: ""} (empty string) => throws min length error', () => {
      expect(() => devLogEventPayloadContract.parse({ chatProcessId: '' })).toThrow(
        /Too small|expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {processId: ""} (empty string) => throws min length error', () => {
      expect(() => devLogEventPayloadContract.parse({ processId: '' })).toThrow(
        /Too small|expected string to have >=1 characters/u,
      );
    });
  });
});
