import { readlineCreateLineReaderAdapter } from './readline-create-line-reader-adapter';
import { readlineCreateLineReaderAdapterProxy } from './readline-create-line-reader-adapter.proxy';
import { EventEmitter } from 'events';

describe('readlineCreateLineReaderAdapter', () => {
  describe('create line reader', () => {
    it('VALID: {input stream} => returns readline interface', () => {
      const proxy = readlineCreateLineReaderAdapterProxy();
      proxy.setupLineReader();

      const input = new EventEmitter() as NodeJS.ReadableStream;
      const result = readlineCreateLineReaderAdapter({ input });

      expect(result).toBeDefined();
      expect(typeof result.on).toBe('function');
    });
  });
});
