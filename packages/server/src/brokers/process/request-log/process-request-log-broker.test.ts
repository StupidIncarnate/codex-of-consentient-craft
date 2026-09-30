import { processRequestLogBroker } from './process-request-log-broker';
import { processRequestLogBrokerProxy } from './process-request-log-broker.proxy';

describe('processRequestLogBroker', () => {
  describe('request log enabled', () => {
    it('VALID: {line} => writes the line to stdout with no prefix', () => {
      const proxy = processRequestLogBrokerProxy();
      proxy.enableRequestLog();

      processRequestLogBroker({ line: '[http] info GET /api/guilds 200 12ms' });

      proxy.disableRequestLog();

      expect(proxy.getWrittenLines()).toStrictEqual([['[http] info GET /api/guilds 200 12ms\n']]);
    });
  });

  describe('request log disabled', () => {
    it('VALID: {line, switch unset} => writes nothing', () => {
      const proxy = processRequestLogBrokerProxy();
      proxy.disableRequestLog();

      processRequestLogBroker({ line: '[http] info GET /api/guilds 200 12ms' });

      expect(proxy.getWrittenLines()).toStrictEqual([]);
    });

    it('VALID: {line, VERBOSE=1 but switch unset} => writes nothing', () => {
      const proxy = processRequestLogBrokerProxy();
      proxy.disableRequestLog();
      proxy.enableVerbose();

      processRequestLogBroker({ line: '[http] info GET /api/guilds 200 12ms' });

      proxy.disableVerbose();

      expect(proxy.getWrittenLines()).toStrictEqual([]);
    });
  });
});
