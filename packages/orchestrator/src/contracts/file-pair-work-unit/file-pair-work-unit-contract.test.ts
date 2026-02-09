import { FilePairWorkUnitStub } from './file-pair-work-unit.stub';
import { filePairWorkUnitContract } from './file-pair-work-unit-contract';

describe('filePairWorkUnitContract', () => {
  describe('valid inputs', () => {
    it('VALID: {implPath, testPath} => parses successfully', () => {
      const result = filePairWorkUnitContract.parse({
        implPath: '/home/user/project/src/broker.ts',
        testPath: '/home/user/project/src/broker.test.ts',
      });

      expect(result).toStrictEqual({
        implPath: '/home/user/project/src/broker.ts',
        testPath: '/home/user/project/src/broker.test.ts',
      });
    });

    it('VALID: {stub} => parses successfully', () => {
      const stub = FilePairWorkUnitStub();

      expect(stub.implPath).toBe('/home/user/project/src/brokers/user/fetch/user-fetch-broker.ts');
      expect(stub.testPath).toBe(
        '/home/user/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
      );
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {relative implPath} => throws error', () => {
      expect(() =>
        filePairWorkUnitContract.parse({
          implPath: 'src/broker.ts',
          testPath: '/home/user/project/src/broker.test.ts',
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {relative testPath} => throws error', () => {
      expect(() =>
        filePairWorkUnitContract.parse({
          implPath: '/home/user/project/src/broker.ts',
          testPath: 'src/broker.test.ts',
        }),
      ).toThrow(/Path must be absolute/u);
    });
  });
});
