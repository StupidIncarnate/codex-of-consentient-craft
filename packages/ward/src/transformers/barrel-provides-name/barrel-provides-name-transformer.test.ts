import { barrelProvidesNameTransformer } from './barrel-provides-name-transformer';
import { TypescriptModuleShapeStub } from '../../contracts/typescript-module-shape/typescript-module-shape.stub';
import { ModuleDependencyStub } from '../../contracts/module-dependency/module-dependency.stub';

describe('barrelProvidesNameTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {name in localExportNames} => returns "yes"', () => {
      const moduleShape = TypescriptModuleShapeStub({
        dependencies: [],
        localExportNames: ['userFetchBroker'],
      });

      const result = barrelProvidesNameTransformer({ moduleShape, name: 'userFetchBroker' });

      expect(result).toBe('yes');
    });

    it('VALID: {name in a named re-export} => returns "yes"', () => {
      const moduleShape = TypescriptModuleShapeStub({
        dependencies: [
          ModuleDependencyStub({
            specifier: './other',
            kind: 'named',
            importedNames: ['userFetchBroker'],
          }),
        ],
        localExportNames: [],
      });

      const result = barrelProvidesNameTransformer({ moduleShape, name: 'userFetchBroker' });

      expect(result).toBe('yes');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {no matching name, no star or opaque edges} => returns "no"', () => {
      const moduleShape = TypescriptModuleShapeStub({
        dependencies: [
          ModuleDependencyStub({
            specifier: './other',
            kind: 'named',
            importedNames: ['somethingElse'],
          }),
        ],
        localExportNames: ['anotherName'],
      });

      const result = barrelProvidesNameTransformer({ moduleShape, name: 'userFetchBroker' });

      expect(result).toBe('no');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {name not matched but a star edge exists} => returns "unknown"', () => {
      const moduleShape = TypescriptModuleShapeStub({
        dependencies: [
          ModuleDependencyStub({ specifier: './nested-barrel', kind: 'star', importedNames: [] }),
        ],
        localExportNames: [],
      });

      const result = barrelProvidesNameTransformer({ moduleShape, name: 'userFetchBroker' });

      expect(result).toBe('unknown');
    });

    it('EDGE: {name not matched but an opaque edge exists} => returns "unknown"', () => {
      const moduleShape = TypescriptModuleShapeStub({
        dependencies: [
          ModuleDependencyStub({
            specifier: './default-export',
            kind: 'opaque',
            importedNames: [],
          }),
        ],
        localExportNames: [],
      });

      const result = barrelProvidesNameTransformer({ moduleShape, name: 'userFetchBroker' });

      expect(result).toBe('unknown');
    });
  });
});
