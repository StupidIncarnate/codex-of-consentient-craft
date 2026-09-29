import { TSTypeAliasDeclarationStub } from '#gateway/npm/typescript-eslint__utils/ts-type-alias-declaration/ts-type-alias-declaration.stub';
import { TSTypeLiteralStub } from '#gateway/npm/typescript-eslint__utils/ts-type-literal/ts-type-literal.stub';
import { isModuleLevelShapeGuard } from './is-module-level-shape-guard';

describe('isModuleLevelShapeGuard', () => {
  it('VALID: {module-level node, data literal type} => returns true', () => {
    const code = 'type T = { a: string };';
    const node = TSTypeAliasDeclarationStub({ code });
    const typeNode = TSTypeLiteralStub({ code });

    expect(isModuleLevelShapeGuard({ node, typeNode })).toBe(true);
  });

  it('VALID: {node inside a function, data literal type} => returns false', () => {
    const code = 'const f = () => { type T = { a: string }; };';
    const node = TSTypeAliasDeclarationStub({ code });
    const typeNode = TSTypeLiteralStub({ code });

    expect(isModuleLevelShapeGuard({ node, typeNode })).toBe(false);
  });

  it('VALID: {module-level node, method set type} => returns false', () => {
    const code = 'type T = { m(): void };';
    const node = TSTypeAliasDeclarationStub({ code });
    const typeNode = TSTypeLiteralStub({ code });

    expect(isModuleLevelShapeGuard({ node, typeNode })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    const typeNode = TSTypeLiteralStub({ code: 'type T = { a: string };' });

    expect(isModuleLevelShapeGuard({ typeNode })).toBe(false);
  });

  it('EMPTY: {typeNode: undefined} => returns false', () => {
    const node = TSTypeAliasDeclarationStub({ code: 'type T = { a: string };' });

    expect(isModuleLevelShapeGuard({ node })).toBe(false);
  });
});
