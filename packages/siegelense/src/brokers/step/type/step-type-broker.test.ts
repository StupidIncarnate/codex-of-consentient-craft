import { stepTypeBroker } from './step-type-broker';
import { stepTypeBrokerProxy } from './step-type-broker.proxy';

describe('stepTypeBroker', () => {
  describe('within given, explicit timeoutMs', () => {
    it('VALID: {target, within, value, timeoutMs} => drives session.fillMatch with the scoped arguments', async () => {
      const proxy = stepTypeBrokerProxy();
      const { session, getFillMatchCalls } = proxy.session();

      const result = await stepTypeBroker({
        session,
        target: '[data-testid="NAME_INPUT"]',
        within: '[data-testid="GUILD_ADD_MODAL"]',
        ref: null,
        value: 'Guild Hall',
        timeoutMs: 5000,
      });

      expect(getFillMatchCalls()).toStrictEqual([
        [
          {
            target: '[data-testid="NAME_INPUT"]',
            within: '[data-testid="GUILD_ADD_MODAL"]',
            value: 'Guild Hall',
            timeoutMs: 5000,
          },
        ],
      ]);
      expect(result).toBe(
        'typed "Guild Hall" into [data-testid="NAME_INPUT"] within [data-testid="GUILD_ADD_MODAL"]',
      );
    });
  });

  describe('no within, no timeoutMs', () => {
    it('VALID: {target, within: null, value, timeoutMs: null} => drives session.fillMatch with the default ceiling and no within key', async () => {
      const proxy = stepTypeBrokerProxy();
      const { session, getFillMatchCalls } = proxy.session();

      const result = await stepTypeBroker({
        session,
        target: '[data-testid="NAME_INPUT"]',
        within: null,
        ref: null,
        value: 'Guild Hall',
        timeoutMs: null,
      });

      expect(getFillMatchCalls()).toStrictEqual([
        [{ target: '[data-testid="NAME_INPUT"]', value: 'Guild Hall', timeoutMs: 30_000 }],
      ]);
      expect(result).toBe('typed "Guild Hall" into [data-testid="NAME_INPUT"]');
    });
  });

  describe('driving by ref', () => {
    it('VALID: {ref, value} => drives session.fillRef with that ref and the default ceiling', async () => {
      const proxy = stepTypeBrokerProxy();
      const { session, getFillRefCalls } = proxy.session();

      const result = await stepTypeBroker({
        session,
        target: null,
        within: null,
        ref: 14,
        value: 'guild-alpha',
        timeoutMs: null,
      });

      expect(getFillRefCalls()).toStrictEqual([
        [{ ref: 14, value: 'guild-alpha', timeoutMs: 30_000 }],
      ]);
      expect(result).toBe('typed "guild-alpha" into ref 14');
    });

    it('VALID: {ref} => never touches the selector path, so a ref and a target can never both drive one fill', async () => {
      const proxy = stepTypeBrokerProxy();
      const { session, getFillMatchCalls } = proxy.session();

      await stepTypeBroker({
        session,
        target: null,
        within: null,
        ref: 14,
        value: 'guild-alpha',
        timeoutMs: null,
      });

      expect(getFillMatchCalls()).toStrictEqual([]);
    });
  });

  describe('neither handle', () => {
    it('INVALID: {no target and no ref} => throws naming the contract that refuses that combination', async () => {
      const proxy = stepTypeBrokerProxy();
      const { session } = proxy.session();

      const error = await stepTypeBroker({
        session,
        target: null,
        within: null,
        ref: null,
        value: 'x',
        timeoutMs: null,
      }).then(
        (): never => {
          throw new Error('Expected stepTypeBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe(
        'step-type-broker: a type reached the driver with neither a `target` nor a `ref`. `stepContract` refuses that combination, so this means a step was built without going through it.',
      );
    });
  });
});
