import { stepWaitForBroker } from './step-wait-for-broker';
import { stepWaitForBrokerProxy } from './step-wait-for-broker.proxy';

describe('stepWaitForBroker', () => {
  describe('the state resolves', () => {
    it('VALID: {target, within, state, timeoutMs} => drives session.waitForMatch and reports the resolved state', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session, getWaitForMatchCalls } = proxy.sessionResolving();

      const result = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: '[data-testid="GUILD_LIST"]',
        state: 'visible',
        timeoutMs: 5000,
      });

      expect(getWaitForMatchCalls()).toStrictEqual([
        [
          {
            target: '[data-testid="MODAL"]',
            within: '[data-testid="GUILD_LIST"]',
            state: 'visible',
            timeoutMs: 5000,
          },
        ],
      ]);
      expect(result).toBe('[data-testid="MODAL"] reached state "visible"');
    });

    it('VALID: {target, within: null, state, timeoutMs: null} => drives session.waitForMatch with the default ceiling and no within key', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session, getWaitForMatchCalls } = proxy.sessionResolving();

      const result = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'hidden',
        timeoutMs: null,
      });

      expect(getWaitForMatchCalls()).toStrictEqual([
        [{ target: '[data-testid="MODAL"]', state: 'hidden', timeoutMs: 30_000 }],
      ]);
      expect(result).toBe('[data-testid="MODAL"] reached state "hidden"');
    });
  });

  describe('the ceiling is hit', () => {
    it('ERROR: {target, timeoutMs} => throws WaitForCeilingHitError naming the state, the target and the ceiling', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session } = proxy.sessionHittingCeiling();

      const error = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: 5000,
      }).then(
        (): never => {
          throw new Error('Expected stepWaitForBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'WaitForCeilingHitError',
        message:
          'visible [data-testid="MODAL"] never resolved in 5000ms: Error: Timeout 30000ms exceeded',
      });
    });
  });
});
