import { processDevLogAdapter } from './process-dev-log-adapter';
import { processDevLogAdapterProxy } from './process-dev-log-adapter.proxy';

describe('processDevLogAdapter', () => {
  describe('verbose enabled', () => {
    it('VALID: {message: "WebSocket connected"} => writes prefixed line to stdout', () => {
      const proxy = processDevLogAdapterProxy();
      proxy.enableVerbose();

      processDevLogAdapter({ message: 'WebSocket connected' });

      proxy.disableVerbose();

      const spy = proxy.getWrittenLines();

      expect(spy.mock.calls).toStrictEqual([['[dev] WebSocket connected\n']]);
    });
  });

  describe('verbose disabled', () => {
    it('VALID: {message: "WebSocket connected"} => does not write to stdout', () => {
      const proxy = processDevLogAdapterProxy();
      proxy.disableVerbose();

      processDevLogAdapter({ message: 'WebSocket connected' });

      const spy = proxy.getWrittenLines();

      expect(spy.mock.calls).toStrictEqual([]);
    });
  });
});
