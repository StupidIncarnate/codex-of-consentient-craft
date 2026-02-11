import { Readable } from 'stream';

import { readlineCreateInterfaceAdapter } from './readline-create-interface-adapter';
import { readlineCreateInterfaceAdapterProxy } from './readline-create-interface-adapter.proxy';

describe('readlineCreateInterfaceAdapter', () => {
  describe('onLine callback', () => {
    it('VALID: {input with two lines} => calls onLine callback for each line', () => {
      const proxy = readlineCreateInterfaceAdapterProxy();

      const input = Readable.from([]);
      const rl = readlineCreateInterfaceAdapter({ input });

      const onLine = jest.fn();
      rl.onLine(onLine);

      proxy.emitLines({ lines: ['line-one', 'line-two'] });

      expect(onLine).toHaveBeenCalledTimes(2);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'line-one' });
      expect(onLine).toHaveBeenNthCalledWith(2, { line: 'line-two' });
    });

    it('VALID: {input with single line} => calls onLine callback once', () => {
      const proxy = readlineCreateInterfaceAdapterProxy();

      const input = Readable.from([]);
      const rl = readlineCreateInterfaceAdapter({ input });

      const onLine = jest.fn();
      rl.onLine(onLine);

      proxy.emitLines({ lines: ['single-line'] });

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'single-line' });
    });

    it('EMPTY: {input with no lines} => does not call onLine callback', () => {
      const proxy = readlineCreateInterfaceAdapterProxy();

      const input = Readable.from([]);
      const rl = readlineCreateInterfaceAdapter({ input });

      const onLine = jest.fn();
      rl.onLine(onLine);

      proxy.emitLines({ lines: [] });

      expect(onLine).toHaveBeenCalledTimes(0);
    });
  });

  describe('close', () => {
    it('VALID: close after reading => does not throw', () => {
      readlineCreateInterfaceAdapterProxy();

      const input = Readable.from([]);
      const rl = readlineCreateInterfaceAdapter({ input });

      expect(() => {
        rl.close();
      }).not.toThrow();
    });
  });
});
