import { npmModuleExportShapeContract } from './npm-module-export-shape-contract';
import { NpmModuleExportShapeStub } from './npm-module-export-shape.stub';

describe('npmModuleExportShapeContract', () => {
  it.each(npmModuleExportShapeContract.options)(
    'VALID: {value: %s} => parses to itself',
    (shape) => {
      const result = npmModuleExportShapeContract.parse(NpmModuleExportShapeStub({ value: shape }));

      expect(result).toBe(shape);
    },
  );

  it('VALID: {} => stub defaults to named', () => {
    expect(NpmModuleExportShapeStub()).toBe('named');
  });

  it('INVALID: {value: "commonjs"} => throws a validation error', () => {
    expect(() => npmModuleExportShapeContract.parse('commonjs')).toThrow(/Invalid option/u);
  });
});
