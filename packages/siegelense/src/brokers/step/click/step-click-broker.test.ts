import { stepClickBroker } from './step-click-broker';
import { stepClickBrokerProxy } from './step-click-broker.proxy';

describe('stepClickBroker', () => {
  describe('within given, explicit timeoutMs', () => {
    it('VALID: {target, within, timeoutMs} => drives session.clickMatch with the scoped arguments', async () => {
      const proxy = stepClickBrokerProxy();
      const { session, getClickMatchCalls } = proxy.session();

      const result = await stepClickBroker({
        session,
        target: '[data-testid="PIXEL_BTN"]',
        within: '[data-testid="GUILD_LIST"]',
        ref: null,
        timeoutMs: 5000,
      });

      expect(getClickMatchCalls()).toStrictEqual([
        [
          {
            target: '[data-testid="PIXEL_BTN"]',
            within: '[data-testid="GUILD_LIST"]',
            timeoutMs: 5000,
          },
        ],
      ]);
      expect(result).toBe('clicked [data-testid="PIXEL_BTN"] within [data-testid="GUILD_LIST"]');
    });
  });

  describe('no within, no timeoutMs', () => {
    it('VALID: {target, within: null, timeoutMs: null} => drives session.clickMatch with the default ceiling and no within key', async () => {
      const proxy = stepClickBrokerProxy();
      const { session, getClickMatchCalls } = proxy.session();

      const result = await stepClickBroker({
        session,
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        ref: null,
        timeoutMs: null,
      });

      expect(getClickMatchCalls()).toStrictEqual([
        [{ target: '[data-testid="GUILD_ADD"]', timeoutMs: 30_000 }],
      ]);
      expect(result).toBe('clicked [data-testid="GUILD_ADD"]');
    });
  });

  describe('driving by ref', () => {
    it('VALID: {ref} => drives session.clickRef with that ref and the default ceiling', async () => {
      const proxy = stepClickBrokerProxy();
      const { session, getClickRefCalls } = proxy.session();

      const result = await stepClickBroker({
        session,
        target: null,
        within: null,
        ref: 26,
        timeoutMs: null,
      });

      expect(getClickRefCalls()).toStrictEqual([[{ ref: 26, timeoutMs: 30_000 }]]);
      expect(result).toBe('clicked ref 26');
    });

    it('VALID: {ref} => never touches the selector path, so a ref and a target can never both drive one click', async () => {
      const proxy = stepClickBrokerProxy();
      const { session, getClickMatchCalls } = proxy.session();

      await stepClickBroker({ session, target: null, within: null, ref: 26, timeoutMs: 5000 });

      expect(getClickMatchCalls()).toStrictEqual([]);
    });

    it('VALID: {ref, explicit timeoutMs} => the caller ceiling reaches clickRef', async () => {
      const proxy = stepClickBrokerProxy();
      const { session, getClickRefCalls } = proxy.session();

      await stepClickBroker({ session, target: null, within: null, ref: 26, timeoutMs: 5000 });

      expect(getClickRefCalls()).toStrictEqual([[{ ref: 26, timeoutMs: 5000 }]]);
    });
  });

  describe('neither handle', () => {
    it('INVALID: {no target and no ref} => throws naming the contract that refuses that combination', async () => {
      const proxy = stepClickBrokerProxy();
      const { session } = proxy.session();

      const error = await stepClickBroker({
        session,
        target: null,
        within: null,
        ref: null,
        timeoutMs: null,
      }).then(
        (): never => {
          throw new Error('Expected stepClickBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe(
        'step-click-broker: a click reached the driver with neither a `target` nor a `ref`. `stepContract` refuses that combination, so this means a step was built without going through it.',
      );
    });
  });
});
