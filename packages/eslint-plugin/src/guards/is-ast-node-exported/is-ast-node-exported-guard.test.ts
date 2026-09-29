import { VariableDeclaratorStub } from '#gateway/npm/typescript-eslint__utils/variable-declarator/variable-declarator.stub';
import { FunctionDeclarationStub } from '#gateway/npm/typescript-eslint__utils/function-declaration/function-declaration.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isAstNodeExportedGuard } from './is-ast-node-exported-guard';

describe('isAstNodeExportedGuard', () => {
  it('VALID: {node with ExportNamedDeclaration parent} => returns true', () => {
    const node = VariableDeclaratorStub({ code: 'export const x;' });

    expect(isAstNodeExportedGuard({ node })).toBe(true);
  });

  it('VALID: {node with ExportDefaultDeclaration parent} => returns true', () => {
    const node = FunctionDeclarationStub({ code: 'export default function f() {};' });

    expect(isAstNodeExportedGuard({ node })).toBe(true);
  });

  it('VALID: {node with export ancestor} => returns true', () => {
    const node = IdentifierStub({ code: 'export const x;' });

    expect(isAstNodeExportedGuard({ node })).toBe(true);
  });

  it('VALID: {node with non-export parents} => returns false', () => {
    const node = VariableDeclaratorStub({ code: 'const x;' });

    expect(isAstNodeExportedGuard({ node })).toBe(false);
  });

  it('EMPTY: {node without parent} => returns false', () => {
    const node = IdentifierStub({ code: 'x;' });

    expect(isAstNodeExportedGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstNodeExportedGuard({ node: undefined })).toBe(false);
  });
});
