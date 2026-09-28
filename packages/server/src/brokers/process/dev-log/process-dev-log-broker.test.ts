import { processDevLogBroker } from './process-dev-log-broker';
import { processDevLogBrokerProxy } from './process-dev-log-broker.proxy';

describe('processDevLogBroker', () => {
  describe('verbose enabled', () => {
    it('VALID: {message: "WebSocket connected"} => writes prefixed line to stdout', () => {
      const proxy = processDevLogBrokerProxy();
      proxy.enableVerbose();

      processDevLogBroker({ message: 'WebSocket connected' });

      proxy.disableVerbose();

      expect(proxy.getWrittenLines()).toStrictEqual([['[dev] WebSocket connected\n']]);
    });
  });

  describe('verbose disabled', () => {
    it('VALID: {message: "WebSocket connected"} => does not write to stdout', () => {
      const proxy = processDevLogBrokerProxy();
      proxy.disableVerbose();

      processDevLogBroker({ message: 'WebSocket connected' });

      expect(proxy.getWrittenLines()).toStrictEqual([]);
    });
  });
});
