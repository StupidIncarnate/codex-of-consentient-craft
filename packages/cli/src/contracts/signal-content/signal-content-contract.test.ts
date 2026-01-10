import { signalContentContract } from './signal-content-contract';
import { SignalContentStub, ReturnSignalStub } from './signal-content.stub';

describe('signalContentContract', () => {
  describe('valid quest signals', () => {
    it('VALID: {type: "quest-complete"} => parses successfully', () => {
      const signal = SignalContentStub({ type: 'quest-complete' });

      const result = signalContentContract.parse(signal);

      expect(result).toStrictEqual({
        type: 'quest-complete',
      });
    });

    it('VALID: {type: "quest-complete", questId: "abc-123"} => parses with questId', () => {
      const signal = SignalContentStub({
        type: 'quest-complete',
        questId: 'abc-123',
      });

      const result = signalContentContract.parse(signal);

      expect(result).toStrictEqual({
        type: 'quest-complete',
        questId: 'abc-123',
      });
    });

    it('VALID: {type: "quest-error", message: "Something failed"} => parses with message', () => {
      const signal = SignalContentStub({
        type: 'quest-error',
        message: 'Something failed',
      });

      const result = signalContentContract.parse(signal);

      expect(result).toStrictEqual({
        type: 'quest-error',
        message: 'Something failed',
      });
    });

    it('VALID: {type: "agent-ready"} => parses agent-ready type', () => {
      const signal = SignalContentStub({ type: 'agent-ready' });

      const result = signalContentContract.parse(signal);

      expect(result).toStrictEqual({
        type: 'agent-ready',
      });
    });
  });

  describe('valid return signals', () => {
    it('VALID: {action: "return", screen: "list"} => parses return signal', () => {
      const signal = ReturnSignalStub({ screen: 'list' });

      const result = signalContentContract.parse(signal);

      expect(result).toMatchObject({
        action: 'return',
        screen: 'list',
      });
      expect(result).toHaveProperty('timestamp');
    });

    it('VALID: {action: "return", screen: "menu"} => parses return signal with menu', () => {
      const signal = ReturnSignalStub({ screen: 'menu' });

      const result = signalContentContract.parse(signal);

      expect(result).toMatchObject({
        action: 'return',
        screen: 'menu',
      });
    });
  });

  describe('invalid signals', () => {
    it('INVALID_TYPE: {type: "unknown-type"} => throws validation error', () => {
      expect(() => {
        signalContentContract.parse({
          type: 'unknown-type',
        });
      }).toThrow();
    });

    it('INVALID_TYPE: empty object => throws validation error', () => {
      expect(() => {
        signalContentContract.parse({});
      }).toThrow();
    });

    it('INVALID_TYPE: {action: "invalid"} => throws validation error for invalid action', () => {
      expect(() => {
        signalContentContract.parse({
          action: 'invalid',
          screen: 'list',
          timestamp: new Date().toISOString(),
        });
      }).toThrow();
    });
  });
});
