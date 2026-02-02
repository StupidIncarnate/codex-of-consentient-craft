import { FileWorkUnitStub } from './file-work-unit.stub';
import { fileWorkUnitContract } from './file-work-unit-contract';

describe('fileWorkUnitContract', () => {
  describe('valid inputs', () => {
    it('VALID: {filePath, errors} => parses successfully', () => {
      const result = fileWorkUnitContract.parse({
        filePath: '/home/user/project/src/example.ts',
        errors: ['Missing return type'],
      });

      expect(result).toStrictEqual({
        filePath: '/home/user/project/src/example.ts',
        errors: ['Missing return type'],
      });
    });

    it('VALID: {stub} => parses successfully', () => {
      const stub = FileWorkUnitStub();

      expect(stub.filePath).toBe('/home/user/project/src/example.ts');
      expect(stub.errors).toStrictEqual(['Missing return type on exported function']);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {relative filePath} => throws error', () => {
      expect(() =>
        fileWorkUnitContract.parse({
          filePath: 'src/example.ts',
          errors: ['Missing return type'],
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {errors not array} => throws error', () => {
      expect(() =>
        fileWorkUnitContract.parse({
          filePath: '/home/user/project/src/example.ts',
          errors: 'Missing return type',
        }),
      ).toThrow(/Expected array/u);
    });
  });
});
