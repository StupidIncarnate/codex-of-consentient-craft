import { astFunctionTypeTransformer } from './ast-function-type-transformer';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

describe('astFunctionTypeTransformer', () => {
  it('VALID: {node with TSBooleanKeyword return type} => returns guard', () => {
    const parent = TsestreeStub({
      type: 'VariableDeclarator',
    });
    Object.assign(parent, {
      init: {
        type: 'ArrowFunctionExpression',
        returnType: {
          typeAnnotation: {
            type: 'TSBooleanKeyword',
          },
        },
      },
    });
    const node = TsestreeStub({ parent });

    expect(astFunctionTypeTransformer({ node })).toBe('guard');
  });

  it('VALID: {node with non-boolean return type} => returns transformer', () => {
    const parent = TsestreeStub({
      type: 'VariableDeclarator',
    });
    Object.assign(parent, {
      init: {
        type: 'ArrowFunctionExpression',
        returnType: {
          typeAnnotation: {
            type: 'TSStringKeyword',
          },
        },
      },
    });
    const node = TsestreeStub({ parent });

    expect(astFunctionTypeTransformer({ node })).toBe('transformer');
  });

  it('VALID: {node without return type} => returns unknown', () => {
    const parent = TsestreeStub({
      type: 'VariableDeclarator',
    });
    Object.assign(parent, {
      init: {
        type: 'ArrowFunctionExpression',
      },
    });
    const node = TsestreeStub({ parent });

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('VALID: {node with non-ArrowFunctionExpression init} => returns unknown', () => {
    const parent = TsestreeStub({
      type: 'VariableDeclarator',
    });
    Object.assign(parent, {
      init: {
        type: 'FunctionExpression',
      },
    });
    const node = TsestreeStub({ parent });

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('VALID: {node with non-VariableDeclarator parent} => returns unknown', () => {
    const parent = TsestreeStub({
      type: 'ExportNamedDeclaration',
    });
    const node = TsestreeStub({ parent });

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('EMPTY: {node without parent} => returns unknown', () => {
    const node = TsestreeStub();

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });
});
