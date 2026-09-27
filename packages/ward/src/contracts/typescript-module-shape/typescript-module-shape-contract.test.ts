import { typescriptModuleShapeContract } from './typescript-module-shape-contract';
import { TypescriptModuleShapeStub } from './typescript-module-shape.stub';
import { ModuleDependencyStub } from '../module-dependency/module-dependency.stub';

describe('typescriptModuleShapeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {localExportNames} => parses successfully', () => {
      const result = typescriptModuleShapeContract.parse(
        TypescriptModuleShapeStub({ localExportNames: ['userFetchBroker'] }),
      );

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['userFetchBroker'] });
    });

    it('VALID: {dependencies} => parses successfully', () => {
      const dependency = ModuleDependencyStub();
      const result = typescriptModuleShapeContract.parse(
        TypescriptModuleShapeStub({ dependencies: [dependency], localExportNames: [] }),
      );

      expect(result).toStrictEqual({ dependencies: [dependency], localExportNames: [] });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing dependencies} => throws validation error', () => {
      expect(() => typescriptModuleShapeContract.parse({ localExportNames: [] })).toThrow(
        /received undefined/u,
      );
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a shape with one local export', () => {
      const result = TypescriptModuleShapeStub();

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['foo'] });
    });
  });
});
