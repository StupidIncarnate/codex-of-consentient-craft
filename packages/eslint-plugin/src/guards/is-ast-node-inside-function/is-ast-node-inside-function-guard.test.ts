import { isAstNodeInsideFunctionGuard } from './is-ast-node-inside-function-guard';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

describe('isAstNodeInsideFunctionGuard', () => {
  it('VALID: {node with ArrowFunctionExpression parent} => returns true', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      parent: TsestreeStub({
        type: 'ArrowFunctionExpression',
      }),
    });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with FunctionExpression parent} => returns true', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      parent: TsestreeStub({
        type: 'FunctionExpression',
      }),
    });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with FunctionDeclaration parent} => returns true', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      parent: TsestreeStub({
        type: 'FunctionDeclaration',
      }),
    });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with nested function ancestor} => returns true', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      parent: TsestreeStub({
        type: 'VariableDeclarator',
        parent: TsestreeStub({
          type: 'VariableDeclaration',
          parent: TsestreeStub({
            type: 'ArrowFunctionExpression',
          }),
        }),
      }),
    });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with non-function parents} => returns false', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      parent: TsestreeStub({
        type: 'Program',
      }),
    });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(false);
  });

  it('EMPTY: {node without parent} => returns false', () => {
    const node = TsestreeStub({
      type: 'Identifier',
    });

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstNodeInsideFunctionGuard({ node: undefined })).toBe(false);
  });
});
