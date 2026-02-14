import { collectedExportContract } from './collected-export-contract';
import { CollectedExportStub } from './collected-export.stub';

describe('CollectedExportContract', () => {
  it('VALID: {} => returns default CollectedExport', () => {
    const result = CollectedExportStub();

    expect(result).toStrictEqual({
      type: 'VariableDeclaration',
      name: 'testExport',
      isTypeOnly: false,
    });
  });

  it('VALID: {isTypeOnly: true} => returns type-only export', () => {
    const result = CollectedExportStub({ isTypeOnly: true });

    expect(result).toStrictEqual({
      type: 'VariableDeclaration',
      name: 'testExport',
      isTypeOnly: true,
    });
  });

  it('VALID: {type: "FunctionDeclaration"} => returns function export', () => {
    const result = CollectedExportStub({ type: 'FunctionDeclaration' });

    expect(result).toStrictEqual({
      type: 'FunctionDeclaration',
      name: 'testExport',
      isTypeOnly: false,
    });
  });

  it('INVALID: missing type => throws ZodError', () => {
    expect(() => collectedExportContract.parse({ name: 'test', isTypeOnly: false })).toThrow(
      'Required',
    );
  });
});
