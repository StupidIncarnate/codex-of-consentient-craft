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
        value: 'Guild Hall',
        timeoutMs: null,
      });

      expect(getFillMatchCalls()).toStrictEqual([
        [{ target: '[data-testid="NAME_INPUT"]', value: 'Guild Hall', timeoutMs: 30_000 }],
      ]);
      expect(result).toBe('typed "Guild Hall" into [data-testid="NAME_INPUT"]');
    });
  });
});
