import { orchestrationEventPayloadKeyContract } from './orchestration-event-payload-key-contract';
import { OrchestrationEventPayloadKeyStub } from './orchestration-event-payload-key.stub';

describe('orchestrationEventPayloadKeyContract', () => {
  describe('valid keys', () => {
    it('VALID: {value: "questId"} => parses successfully', () => {
      const key = OrchestrationEventPayloadKeyStub({ value: 'questId' });

      const result = orchestrationEventPayloadKeyContract.parse(key);

      expect(result).toBe('questId');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => orchestrationEventPayloadKeyContract.parse(123)).toThrow(/expected string/u);
    });
  });
});
