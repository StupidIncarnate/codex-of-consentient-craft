import { astFunctionTypeTransformer } from './ast-function-type-transformer';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

describe('astFunctionTypeTransformer', () => {
  it('VALID: {node with TSBooleanKeyword return type} => returns guard', () => {
    const typeAnnotationNode = TsestreeStub({
      type: 'TSBooleanKeyword',
    });
    const returnTypeNode = TsestreeStub({
      type: 'TSTypeAnnotation',
      typeAnnotation: typeAnnotationNode,
    });
    const initNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      returnType: returnTypeNode,
    });
    const parent = TsestreeStub({
      type: 'VariableDeclarator',
      init: initNode,
    });
    const node = TsestreeStub({ parent });

    expect(astFunctionTypeTransformer({ node })).toBe('guard');
  });

  it('VALID: {node with non-boolean return type} => returns transformer', () => {
    const typeAnnotationNode = TsestreeStub({
      type: 'TSStringKeyword',
    });
    const returnTypeNode = TsestreeStub({
      type: 'TSTypeAnnotation',
      typeAnnotation: typeAnnotationNode,
    });
    const initNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      returnType: returnTypeNode,
    });
    const parent = TsestreeStub({
      type: 'VariableDeclarator',
      init: initNode,
    });
    const node = TsestreeStub({ parent });

    expect(astFunctionTypeTransformer({ node })).toBe('transformer');
  });

  it('VALID: {node without return type} => returns unknown', () => {
    const initNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
    });
    const parent = TsestreeStub({
      type: 'VariableDeclarator',
      init: initNode,
    });
    const node = TsestreeStub({ parent });

    expect(astFunctionTypeTransformer({ node })).toBe('unknown');
  });

  it('VALID: {node with non-ArrowFunctionExpression init} => returns unknown', () => {
    const initNode = TsestreeStub({
      type: 'FunctionExpression',
    });
    const parent = TsestreeStub({
      type: 'VariableDeclarator',
      init: initNode,
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
