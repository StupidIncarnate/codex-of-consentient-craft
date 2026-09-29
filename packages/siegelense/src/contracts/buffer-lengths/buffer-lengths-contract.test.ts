import { bufferLengthsContract } from './buffer-lengths-contract';
import { BufferLengthsStub } from './buffer-lengths.stub';

describe('bufferLengthsContract', () => {
  describe('valid lengths', () => {
    it('VALID: {every buffer measured} => parses to exactly the three counts', () => {
      const result = bufferLengthsContract.parse({
        consoleLines: 12,
        networkLines: 3,
        websocketLines: 1,
      });

      expect(result).toStrictEqual({ consoleLines: 12, networkLines: 3, websocketLines: 1 });
    });

    it('VALID: {} => the stub reports every buffer at zero', () => {
      const lengths = BufferLengthsStub();

      expect(lengths).toStrictEqual({ consoleLines: 0, networkLines: 0, websocketLines: 0 });
    });

    it('VALID: {networkLines: 12} => the stub overrides one count and keeps the others', () => {
      const lengths = BufferLengthsStub({ networkLines: 12 });

      expect(lengths).toStrictEqual({ consoleLines: 0, networkLines: 12, websocketLines: 0 });
    });
  });

  describe('invalid lengths', () => {
    it('INVALID: {consoleLines: -1} => throws on a negative length', () => {
      expect(() =>
        bufferLengthsContract.parse({ consoleLines: -1, networkLines: 0, websocketLines: 0 }),
      ).toThrow(/expected number to be >=0/u);
    });

    it('INVALID: {websocketLines missing} => throws on the missing buffer', () => {
      expect(() => bufferLengthsContract.parse({ consoleLines: 0, networkLines: 0 })).toThrow(
        /websocketLines/u,
      );
    });

    it('INVALID: {an unknown key} => throws on the unrecognized key', () => {
      expect(() =>
        bufferLengthsContract.parse({
          consoleLines: 0,
          networkLines: 0,
          websocketLines: 0,
          errorLines: 0,
        }),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
