import { chatOutputPayloadContract } from './chat-output-payload-contract';
import { ChatOutputPayloadStub } from './chat-output-payload.stub';

describe('chatOutputPayloadContract', () => {
  describe('valid inputs', () => {
    it('VALID: empty object => parses successfully', () => {
      const result = ChatOutputPayloadStub({});

      expect(result.role).toBe(undefined);
    });

    it('VALID: {slotIndex: 0} => parses successfully', () => {
      const result = chatOutputPayloadContract.parse({ slotIndex: 0 });

      expect(result.slotIndex).toBe(0);
    });

    it('VALID: passthrough additional fields => preserves them', () => {
      const result = chatOutputPayloadContract.parse({ extra: 'stuff' }) as Record<
        PropertyKey,
        unknown
      >;

      expect(result.extra).toBe('stuff');
    });
  });
});
