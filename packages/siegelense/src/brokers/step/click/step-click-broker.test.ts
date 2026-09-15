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
        timeoutMs: null,
      });

      expect(getClickMatchCalls()).toStrictEqual([
        [{ target: '[data-testid="GUILD_ADD"]', timeoutMs: 30_000 }],
      ]);
      expect(result).toBe('clicked [data-testid="GUILD_ADD"]');
    });
  });
});
