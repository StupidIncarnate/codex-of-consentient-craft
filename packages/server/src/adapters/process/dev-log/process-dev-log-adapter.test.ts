import { processDevLogAdapter } from './process-dev-log-adapter';
import { processDevLogAdapterProxy } from './process-dev-log-adapter.proxy';

describe('processDevLogAdapter', () => {
  describe('dev mode enabled', () => {
    it('VALID: {message: "WebSocket connected"} => writes prefixed line to stdout', () => {
      const proxy = processDevLogAdapterProxy();
      proxy.enableDev();

      processDevLogAdapter({ message: 'WebSocket connected' });

      proxy.disableDev();

      const spy = proxy.getWrittenLines();

      expect(spy).toHaveBeenCalledWith('[dev] WebSocket connected\n');
    });
  });

  describe('dev mode disabled', () => {
    it('VALID: {message: "WebSocket connected"} => does not write to stdout', () => {
      const proxy = processDevLogAdapterProxy();
      proxy.disableDev();

      processDevLogAdapter({ message: 'WebSocket connected' });

      const spy = proxy.getWrittenLines();

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
