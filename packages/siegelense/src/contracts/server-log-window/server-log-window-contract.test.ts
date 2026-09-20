import { serverLogWindowContract } from './server-log-window-contract';
import { ServerLogWindowStub } from './server-log-window.stub';

describe('serverLogWindowContract', () => {
  describe('valid windows', () => {
    it('VALID: {fromByte: 1024, toByte: 2048} => parses the complete window', () => {
      const result = serverLogWindowContract.parse({ fromByte: 1024, toByte: 2048 });

      expect(result).toStrictEqual({ fromByte: 1024, toByte: 2048 });
    });

    it('EDGE: {fromByte: 0, toByte: 0} => a step spanning zero server-log bytes parses', () => {
      const result = serverLogWindowContract.parse({ fromByte: 0, toByte: 0 });

      expect(result).toStrictEqual({ fromByte: 0, toByte: 0 });
    });
  });

  describe('invalid windows', () => {
    it('INVALID: {missing toByte} => throws validation error', () => {
      expect(() =>
        serverLogWindowContract.parse({
          fromByte: 0,
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {fromByte: -1} => a negative byte offset throws validation error', () => {
      expect(() =>
        serverLogWindowContract.parse({
          fromByte: -1,
          toByte: 0,
        }),
      ).toThrow(/greater than or equal to 0/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a window from byte 0 to byte 512', () => {
      const result = ServerLogWindowStub();

      expect(result).toStrictEqual({ fromByte: 0, toByte: 512 });
    });
  });
});
