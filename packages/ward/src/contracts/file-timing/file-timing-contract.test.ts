import { fileTimingContract } from './file-timing-contract';
import { FileTimingStub } from './file-timing.stub';

describe('fileTimingContract', () => {
  describe('valid inputs', () => {
    it('VALID: {filePath and durationMs} => parses successfully', () => {
      const result = fileTimingContract.parse(FileTimingStub());

      expect(result).toStrictEqual({
        filePath: 'src/index.ts',
        durationMs: 150,
        testMs: 20,
      });
    });

    it('VALID: {custom values} => parses successfully', () => {
      const result = fileTimingContract.parse(
        FileTimingStub({
          filePath: 'packages/ward/src/brokers/test.ts',
          durationMs: 8300,
        }),
      );

      expect(result).toStrictEqual({
        filePath: 'packages/ward/src/brokers/test.ts',
        durationMs: 8300,
        testMs: 20,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {empty filePath} => throws validation error', () => {
      expect(() =>
        fileTimingContract.parse({
          filePath: '',
          durationMs: 100,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {negative durationMs} => throws validation error', () => {
      expect(() =>
        fileTimingContract.parse({
          filePath: 'src/index.ts',
          durationMs: -1,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {missing all fields} => throws validation error', () => {
      expect(() => fileTimingContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid file timing', () => {
      const result = FileTimingStub();

      expect(result).toStrictEqual({
        filePath: 'src/index.ts',
        durationMs: 150,
        testMs: 20,
      });
    });

    it('VALID: {custom filePath} => creates file timing with override', () => {
      const result = FileTimingStub({ filePath: 'src/utils.ts' });

      expect(result).toStrictEqual({
        filePath: 'src/utils.ts',
        durationMs: 150,
        testMs: 20,
      });
    });
  });

  describe('testMs defaults', () => {
    it('VALID: {testMs omitted} => defaults to 0', () => {
      const result = fileTimingContract.parse({
        filePath: 'src/index.ts',
        durationMs: 150,
      });

      expect(result.testMs).toBe(0);
    });

    it('VALID: {testMs provided} => preserves value', () => {
      const result = fileTimingContract.parse({
        filePath: 'src/index.ts',
        durationMs: 150,
        testMs: 83,
      });

      expect(result.testMs).toBe(83);
    });
  });
});
