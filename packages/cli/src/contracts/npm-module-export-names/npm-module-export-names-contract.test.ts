import { npmModuleExportNamesContract } from './npm-module-export-names-contract';
import { NpmModuleExportNamesStub } from './npm-module-export-names.stub';

describe('npmModuleExportNamesContract', () => {
  it('VALID: {} => stub holds one value name and one type name', () => {
    expect(NpmModuleExportNamesStub()).toStrictEqual({ values: ['version'], types: ['Options'] });
  });

  it('EMPTY: {values: [], types: []} => parses an export = target with no members', () => {
    const result = npmModuleExportNamesContract.parse({ values: [], types: [] });

    expect(result).toStrictEqual({ values: [], types: [] });
  });

  it('INVALID: {values: [""]} => throws a validation error', () => {
    expect(() => npmModuleExportNamesContract.parse({ values: [''], types: [] })).toThrow(
      /Too small/u,
    );
  });
});
