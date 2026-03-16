import { signalBackBroker } from './signal-back-broker';
import { signalBackBrokerProxy } from './signal-back-broker.proxy';
import { SignalBackInputStub } from '../../../contracts/signal-back-input/signal-back-input.stub';

describe('signalBackBroker', () => {
  describe('complete signal', () => {
    it('VALID: {signal: "complete"} => returns validated complete signal', () => {
      signalBackBrokerProxy();
      const input = SignalBackInputStub({
        signal: 'complete',
        summary: 'Task finished',
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'complete',
          summary: 'Task finished',
        },
      });
    });
  });

  describe('failed signal', () => {
    it('VALID: {signal: "failed"} => returns validated failed signal', () => {
      signalBackBrokerProxy();
      const input = SignalBackInputStub({
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'failed',
          summary: 'Tests failing in user-fetch-broker',
        },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {invalid signal type} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { signal: 'unknown' } as never,
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('VALID: {signal only, no summary} => succeeds because summary is optional', () => {
      signalBackBrokerProxy();

      const result = signalBackBroker({
        input: { signal: 'complete' } as never,
      });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'complete',
        },
      });
    });

    it('ERROR: {removed signal type partially-complete} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { signal: 'partially-complete' } as never,
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('ERROR: {removed signal type needs-role-followup} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { signal: 'needs-role-followup' } as never,
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
