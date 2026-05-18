import { questGetServerConfigBroker } from './quest-get-server-config-broker';
import { questGetServerConfigBrokerProxy } from './quest-get-server-config-broker.proxy';

describe('questGetServerConfigBroker', () => {
  describe('valid resolutions', () => {
    it('VALID: {DUNGEONMASTER_PORT=3737} => returns {baseUrl: "http://dungeonmaster.localhost:3737", port: 3737}', () => {
      const proxy = questGetServerConfigBrokerProxy();
      proxy.setPort({ value: '3737' });

      const result = questGetServerConfigBroker();

      expect(result).toStrictEqual({
        baseUrl: 'http://dungeonmaster.localhost:3737',
        port: 3737,
      });
    });

    it('VALID: {DUNGEONMASTER_PORT=4750} => returns {baseUrl: "http://dungeonmaster.localhost:4750", port: 4750}', () => {
      const proxy = questGetServerConfigBrokerProxy();
      proxy.setPort({ value: '4750' });

      const result = questGetServerConfigBroker();

      expect(result).toStrictEqual({
        baseUrl: 'http://dungeonmaster.localhost:4750',
        port: 4750,
      });
    });

    it('VALID: {DUNGEONMASTER_PORT=65535 max port} => returns {port: 65535, baseUrl with port 65535}', () => {
      const proxy = questGetServerConfigBrokerProxy();
      proxy.setPort({ value: '65535' });

      const result = questGetServerConfigBroker();

      expect(result).toStrictEqual({
        baseUrl: 'http://dungeonmaster.localhost:65535',
        port: 65535,
      });
    });
  });
});
