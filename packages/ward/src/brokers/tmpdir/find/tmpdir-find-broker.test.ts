import { tmpdirFindBroker } from './tmpdir-find-broker';
import { tmpdirFindBrokerProxy } from './tmpdir-find-broker.proxy';

describe('tmpdirFindBroker', () => {
  describe('the path it answers with', () => {
    it('VALID: {os reports /tmp} => returns /tmp', () => {
      const proxy = tmpdirFindBrokerProxy();
      proxy.returns({ path: '/tmp' });

      const result = tmpdirFindBroker();

      expect(result).toBe('/tmp');
    });

    it('VALID: {os reports a per-user scratch dir} => returns that path', () => {
      const proxy = tmpdirFindBrokerProxy();
      proxy.returns({ path: '/var/folders/9k/T' });

      const result = tmpdirFindBroker();

      expect(result).toBe('/var/folders/9k/T');
    });
  });

  describe('what it rejects', () => {
    it('INVALID: {os reports a relative path} => throws', () => {
      const proxy = tmpdirFindBrokerProxy();
      proxy.returns({ path: 'tmp' });

      expect(() => tmpdirFindBroker()).toThrow(/absolute/u);
    });
  });
});
