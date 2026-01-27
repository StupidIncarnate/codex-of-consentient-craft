import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { filePairWorkUnitContract } from './file-pair-work-unit-contract';
import { FilePairWorkUnitStub } from './file-pair-work-unit.stub';

describe('filePairWorkUnitContract', () => {
  describe('valid file pair work units', () => {
    it('VALID: {implPath, testPath} => parses successfully', () => {
      const implPath = AbsoluteFilePathStub({ value: '/src/broker.ts' });
      const testPath = AbsoluteFilePathStub({ value: '/src/broker.test.ts' });

      const result = filePairWorkUnitContract.parse({
        implPath,
        testPath,
      });

      expect(result).toStrictEqual({
        implPath,
        testPath,
      });
    });

    it('VALID: {stub defaults} => parses with default values', () => {
      const workUnit = FilePairWorkUnitStub();

      const result = filePairWorkUnitContract.parse(workUnit);

      expect(result).toStrictEqual(workUnit);
    });

    it('VALID: {Windows paths} => parses Windows absolute paths', () => {
      const implPath = AbsoluteFilePathStub({ value: 'C:\\project\\src\\broker.ts' });
      const testPath = AbsoluteFilePathStub({ value: 'C:\\project\\src\\broker.test.ts' });

      const result = filePairWorkUnitContract.parse({
        implPath,
        testPath,
      });

      expect(result).toStrictEqual({
        implPath,
        testPath,
      });
    });

    it('VALID: {stub with custom implPath} => parses with override', () => {
      const customImplPath = AbsoluteFilePathStub({ value: '/custom/path/file.ts' });
      const workUnit = FilePairWorkUnitStub({ implPath: customImplPath });

      const result = filePairWorkUnitContract.parse(workUnit);

      expect(result.implPath).toBe(customImplPath);
    });

    it('VALID: {stub with custom testPath} => parses with override', () => {
      const customTestPath = AbsoluteFilePathStub({ value: '/custom/path/file.test.ts' });
      const workUnit = FilePairWorkUnitStub({ testPath: customTestPath });

      const result = filePairWorkUnitContract.parse(workUnit);

      expect(result.testPath).toBe(customTestPath);
    });
  });

  describe('invalid file pair work units', () => {
    it('INVALID_IMPL_PATH: {implPath: "relative/path"} => throws validation error', () => {
      const testPath = AbsoluteFilePathStub({ value: '/src/file.test.ts' });

      expect(() =>
        filePairWorkUnitContract.parse({
          implPath: 'relative/path',
          testPath,
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID_TEST_PATH: {testPath: "relative/path"} => throws validation error', () => {
      const implPath = AbsoluteFilePathStub({ value: '/src/file.ts' });

      expect(() =>
        filePairWorkUnitContract.parse({
          implPath,
          testPath: 'relative/path',
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID_IMPL_PATH: {implPath: ""} => throws validation error', () => {
      const testPath = AbsoluteFilePathStub({ value: '/src/file.test.ts' });

      expect(() =>
        filePairWorkUnitContract.parse({
          implPath: '',
          testPath,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_TEST_PATH: {testPath: ""} => throws validation error', () => {
      const implPath = AbsoluteFilePathStub({ value: '/src/file.ts' });

      expect(() =>
        filePairWorkUnitContract.parse({
          implPath,
          testPath: '',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_MISSING: {} => throws Required', () => {
      expect(() => filePairWorkUnitContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID_MISSING: {implPath only} => throws Required for testPath', () => {
      const implPath = AbsoluteFilePathStub({ value: '/src/file.ts' });

      expect(() =>
        filePairWorkUnitContract.parse({
          implPath,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_MISSING: {testPath only} => throws Required for implPath', () => {
      const testPath = AbsoluteFilePathStub({ value: '/src/file.test.ts' });

      expect(() =>
        filePairWorkUnitContract.parse({
          testPath,
        }),
      ).toThrow(/Required/u);
    });
  });
});
