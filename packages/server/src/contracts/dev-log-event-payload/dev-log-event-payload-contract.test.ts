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
});
