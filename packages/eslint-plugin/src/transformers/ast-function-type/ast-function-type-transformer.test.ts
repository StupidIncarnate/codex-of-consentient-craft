import { astFunctionTypeTransformer } from './ast-function-type-transformer';
import type { TSESTree } from '../../adapters/typescript-eslint-utils/typescript-eslint-utils-tsestree';

describe('astFunctionTypeTransformer', () => {
  it('VALID: {node with TSBooleanKeyword return type} => returns guard', () => {
    const node = {
      parent: {
        type: 'VariableDeclarator',
        init: {
          type: 'ArrowFunctionExpression',
          returnType: {
            typeAnnotation: {
              type: 'TSBooleanKeyword',
            },
          },
        },
      },
    } as TSESTree.Node;

    expect(astFunctionTypeTransformer({ node })).toBe('guard');
  });

  it('VALID: {node with non-boolean return type} => returns transformer', () => {
    const node = {
      parent: {
        type: 'VariableDeclarator',
        init: {
          type: 'ArrowFunctionExpression',
          returnType: {
            typeAnnotation: {
              type: 'TSStringKeyword',
            },
          },
        },
      },
    } as TSESTree.Node;

    expect(astFunctionTypeTransformer({ node })).toBe('transformer');
  });

  it('VALID: {node without return type} => returns unknown', () => {
    const node = {
      parent: {
        type: 'VariableDeclarator',
        init: {
          type: 'ArrowFunctionExpression',
        },
      },
    } as TSESTree.Node;

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('VALID: {node with non-ArrowFunctionExpression init} => returns unknown', () => {
    const node = {
      parent: {
        type: 'VariableDeclarator',
        init: {
          type: 'FunctionExpression',
        },
      },
    } as TSESTree.Node;

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('VALID: {node with non-VariableDeclarator parent} => returns unknown', () => {
    const node = {
      parent: {
        type: 'ExportNamedDeclaration',
      },
    } as TSESTree.Node;

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('EMPTY: {node without parent} => returns unknown', () => {
    const node = {} as TSESTree.Node;

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });
});
