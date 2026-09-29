import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { ExportNamedDeclarationStub } from '#gateway/npm/typescript-eslint__utils/export-named-declaration/export-named-declaration.stub';
import { astFunctionTypeTransformer } from './ast-function-type-transformer';

describe('astFunctionTypeTransformer', () => {
  it('VALID: {node with TSBooleanKeyword return type} => returns guard', () => {
    const node = IdentifierStub({ code: 'const x = (): boolean => {};' });

    expect(astFunctionTypeTransformer({ node })).toBe('guard');
  });

  it('VALID: {node with non-boolean return type} => returns transformer', () => {
    const node = IdentifierStub({ code: 'const x = (): string => {};' });

    expect(astFunctionTypeTransformer({ node })).toBe('transformer');
  });

  it('VALID: {node without return type} => returns unknown', () => {
    const node = IdentifierStub({ code: 'const x = () => {};' });

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('VALID: {node with non-ArrowFunctionExpression init} => returns unknown', () => {
    const node = IdentifierStub({ code: 'const x = function () {};' });

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('VALID: {node with non-VariableDeclarator parent} => returns unknown', () => {
    const node = ExportNamedDeclarationStub({ code: 'export {  };' });

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('EMPTY: {node without parent} => returns unknown', () => {
    const node = IdentifierStub({ code: 'x;' });

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });
});
