import { stepGotoBroker } from './step-goto-broker';
import { stepGotoBrokerProxy } from './step-goto-broker.proxy';

describe('stepGotoBroker', () => {
  describe('navigation', () => {
    it('VALID: {path: "/guilds"} => drives session.goto with the path and returns it as the reading', async () => {
      const proxy = stepGotoBrokerProxy();
      const { session, getGotoCalls } = proxy.session();

      const result = await stepGotoBroker({ session, path: '/guilds' });

      expect(getGotoCalls()).toStrictEqual([[{ url: '/guilds' }]]);
      expect(result).toBe('/guilds');
    });
  });
});
