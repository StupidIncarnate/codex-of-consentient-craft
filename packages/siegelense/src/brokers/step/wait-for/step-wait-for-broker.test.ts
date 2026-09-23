import { driverStatics } from '../../../statics/driver/driver-statics';
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

  describe('waitForSettle wiring', () => {
    it('VALID: {target, state resolves, page settles promptly} => waits for settle with the settle statics after waitForMatch resolves', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session, getWaitForSettleCalls } = proxy.sessionResolving();

      const result = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: null,
      });

      expect(getWaitForSettleCalls()).toStrictEqual([
        [
          {
            quietWindowMs: driverStatics.settle.quietWindowMs,
            ceilingMs: driverStatics.settle.ceilingMs,
            pollMs: driverStatics.settle.pollMs,
          },
        ],
      ]);
      expect(result).toBe('[data-testid="MODAL"] reached state "visible"');
    });

    it('VALID: {target, state resolves, page never settles} => reports the ceiling reason and the still-moving signals instead of the plain resolved-state message', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session } = proxy.sessionResolvingNeverSettling();

      const result = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: null,
      });

      expect(result).toBe(
        '[data-testid="MODAL"] reached state "visible"; did not settle after 5000ms (still moving: network)',
      );
    });

    it('ERROR: {waitForMatch hits its ceiling} => never calls waitForSettle, since the throw pre-empts it', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session, getWaitForSettleCalls } = proxy.sessionHittingCeiling();

      await stepWaitForBroker({
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

      expect(getWaitForSettleCalls()).toStrictEqual([]);
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
