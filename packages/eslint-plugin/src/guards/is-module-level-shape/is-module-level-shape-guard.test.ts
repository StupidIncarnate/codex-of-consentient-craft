import { isModuleLevelShapeGuard } from './is-module-level-shape-guard';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

describe('isModuleLevelShapeGuard', () => {
  it('VALID: {module-level node, data literal type} => returns true', () => {
    const node = TsestreeStub({
      type: 'TSTypeAliasDeclaration',
      parent: TsestreeStub({ type: 'Program' }),
    });
    const typeNode = TsestreeStub({
      type: 'TSTypeLiteral',
      members: [
        TsestreeStub({
          type: 'TSPropertySignature',
          typeAnnotation: TsestreeStub({
            type: 'TSTypeAnnotation',
            typeAnnotation: TsestreeStub({ type: 'TSStringKeyword' }),
          }),
        }),
      ],
    });

    expect(isModuleLevelShapeGuard({ node, typeNode })).toBe(true);
  });

  it('VALID: {node inside a function, data literal type} => returns false', () => {
    const node = TsestreeStub({
      type: 'TSTypeAliasDeclaration',
      parent: TsestreeStub({ type: 'ArrowFunctionExpression' }),
    });
    const typeNode = TsestreeStub({
      type: 'TSTypeLiteral',
      members: [TsestreeStub({ type: 'TSPropertySignature' })],
    });

    expect(isModuleLevelShapeGuard({ node, typeNode })).toBe(false);
  });

  it('VALID: {module-level node, method set type} => returns false', () => {
    const node = TsestreeStub({
      type: 'TSTypeAliasDeclaration',
      parent: TsestreeStub({ type: 'Program' }),
    });
    const typeNode = TsestreeStub({
      type: 'TSTypeLiteral',
      members: [TsestreeStub({ type: 'TSMethodSignature' })],
    });

    expect(isModuleLevelShapeGuard({ node, typeNode })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    const typeNode = TsestreeStub({
      type: 'TSTypeLiteral',
      members: [TsestreeStub({ type: 'TSPropertySignature' })],
    });

    expect(isModuleLevelShapeGuard({ typeNode })).toBe(false);
  });

  it('EMPTY: {typeNode: undefined} => returns false', () => {
    const node = TsestreeStub({
      type: 'TSTypeAliasDeclaration',
      parent: TsestreeStub({ type: 'Program' }),
    });

    expect(isModuleLevelShapeGuard({ node })).toBe(false);
  });
});
