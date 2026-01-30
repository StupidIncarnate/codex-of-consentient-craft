import { Readable } from 'stream';
import { readlineCreateInterfaceAdapter } from './readline-create-interface-adapter';
import { readlineCreateInterfaceAdapterProxy } from './readline-create-interface-adapter.proxy';

describe('readlineCreateInterfaceAdapter', () => {
  describe('interface creation', () => {
    it('VALID: {input: readableStream} => calls createInterface with input and crlfDelay Infinity', () => {
      const proxy = readlineCreateInterfaceAdapterProxy();

      const input = new Readable({ read(): void {} });
      readlineCreateInterfaceAdapter({ input });

      expect(proxy.getCreateInterfaceCalls()).toStrictEqual([
        [{ input, crlfDelay: Infinity, terminal: false }],
      ]);
    });
  });
});
