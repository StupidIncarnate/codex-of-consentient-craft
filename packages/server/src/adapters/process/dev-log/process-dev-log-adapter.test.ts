import { processDevLogAdapter } from './process-dev-log-adapter';
import { processDevLogAdapterProxy } from './process-dev-log-adapter.proxy';

describe('processDevLogAdapter', () => {
  describe('verbose enabled', () => {
    it('VALID: {message: "WebSocket connected"} => writes prefixed line to stdout', () => {
      const proxy = processDevLogAdapterProxy();
      proxy.enableVerbose();

      processDevLogAdapter({ message: 'WebSocket connected' });

      proxy.disableVerbose();

      expect(proxy.getWrittenLines()).toStrictEqual([['[dev] WebSocket connected\n']]);
    });
  });

  describe('verbose disabled', () => {
    it('VALID: {message: "WebSocket connected"} => does not write to stdout', () => {
      const proxy = processDevLogAdapterProxy();
      proxy.disableVerbose();

      processDevLogAdapter({ message: 'WebSocket connected' });

      expect(proxy.getWrittenLines()).toStrictEqual([]);
    });
  });
});
