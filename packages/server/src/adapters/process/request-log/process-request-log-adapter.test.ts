import { processRequestLogAdapter } from './process-request-log-adapter';
import { processRequestLogAdapterProxy } from './process-request-log-adapter.proxy';

describe('processRequestLogAdapter', () => {
  describe('request log enabled', () => {
    it('VALID: {line} => writes the line to stdout with no prefix', () => {
      const proxy = processRequestLogAdapterProxy();
      proxy.enableRequestLog();

      const result = processRequestLogAdapter({ line: '[http] info GET /api/guilds 200 12ms' });

      proxy.disableRequestLog();

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getWrittenLines()).toStrictEqual([['[http] info GET /api/guilds 200 12ms\n']]);
    });
  });

  describe('request log disabled', () => {
    it('VALID: {line, switch unset} => writes nothing', () => {
      const proxy = processRequestLogAdapterProxy();
      proxy.disableRequestLog();

      const result = processRequestLogAdapter({ line: '[http] info GET /api/guilds 200 12ms' });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getWrittenLines()).toStrictEqual([]);
    });

    it('VALID: {line, VERBOSE=1 but switch unset} => writes nothing', () => {
      const proxy = processRequestLogAdapterProxy();
      proxy.disableRequestLog();
      process.env.VERBOSE = '1';

      processRequestLogAdapter({ line: '[http] info GET /api/guilds 200 12ms' });

      Reflect.deleteProperty(process.env, 'VERBOSE');

      expect(proxy.getWrittenLines()).toStrictEqual([]);
    });
  });
});
