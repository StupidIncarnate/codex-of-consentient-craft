import { isAstNodeInsideFunctionGuard } from './is-ast-node-inside-function-guard';
import type { TSESTree } from '../../adapters/typescript-eslint-utils/typescript-eslint-utils-tsestree';

describe('isAstNodeInsideFunctionGuard', () => {
  it('VALID: {node with ArrowFunctionExpression parent} => returns true', () => {
    const node = {
      type: 'Identifier',
      parent: {
        type: 'ArrowFunctionExpression',
      },
    } as TSESTree.Node;

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with FunctionExpression parent} => returns true', () => {
    const node = {
      type: 'Identifier',
      parent: {
        type: 'FunctionExpression',
      },
    } as TSESTree.Node;

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with FunctionDeclaration parent} => returns true', () => {
    const node = {
      type: 'Identifier',
      parent: {
        type: 'FunctionDeclaration',
      },
    } as TSESTree.Node;

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with nested function ancestor} => returns true', () => {
    const node = {
      type: 'Identifier',
      parent: {
        type: 'VariableDeclarator',
        parent: {
          type: 'VariableDeclaration',
          parent: {
            type: 'ArrowFunctionExpression',
          },
        },
      },
    } as TSESTree.Node;

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(true);
  });

  it('VALID: {node with non-function parents} => returns false', () => {
    const node = {
      type: 'Identifier',
      parent: {
        type: 'Program',
      },
    } as TSESTree.Node;

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(false);
  });

  it('EMPTY: {node without parent} => returns false', () => {
    const node = {
      type: 'Identifier',
    } as TSESTree.Node;

    expect(isAstNodeInsideFunctionGuard({ node })).toBe(false);
  });
});
