import { typeNameFromAnnotationTransformer } from './type-name-from-annotation-transformer';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

describe('typeNameFromAnnotationTransformer', () => {
  describe('valid input', () => {
    it('VALID: {type: TSTypeAnnotation with TSTypeReference} => returns type name', () => {
      const typeAnnotation = TsestreeStub({
        type: 'TSTypeAnnotation',
        typeAnnotation: TsestreeStub({
          type: 'TSTypeReference',
          typeName: TsestreeStub({
            type: 'Identifier',
            name: 'User',
          }),
        }),
      });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe('User');
    });

    it('VALID: {type: TSTypeReference with Identifier} => returns type name', () => {
      const typeAnnotation = TsestreeStub({
        type: 'TSTypeReference',
        typeName: TsestreeStub({
          type: 'Identifier',
          name: 'Tsestree',
        }),
      });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe('Tsestree');
    });

    it('VALID: {type: TSArrayType} => returns element type name', () => {
      const typeAnnotation = TsestreeStub({
        type: 'TSArrayType',
        typeAnnotation: TsestreeStub({
          type: 'TSTypeReference',
          typeName: TsestreeStub({
            type: 'Identifier',
            name: 'User',
          }),
        }),
      });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe('User');
    });

    it('VALID: {type: TSTypeReference with generic Array<T>} => returns Array', () => {
      const typeAnnotation = TsestreeStub({
        type: 'TSTypeReference',
        typeName: TsestreeStub({
          type: 'Identifier',
          name: 'Array',
        }),
      });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe('Array');
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns null', () => {
      const result = typeNameFromAnnotationTransformer({});

      expect(result).toBeNull();
    });

    it('EMPTY: {typeAnnotation: null} => returns null', () => {
      const result = typeNameFromAnnotationTransformer({ typeAnnotation: null });

      expect(result).toBeNull();
    });

    it('EDGE: {type: TSTypeReference without typeName} => returns null', () => {
      const typeAnnotation = TsestreeStub({
        type: 'TSTypeReference',
        typeName: null,
      });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBeNull();
    });

    it('EDGE: {type: TSTypeReference with non-Identifier typeName} => returns null', () => {
      const typeAnnotation = TsestreeStub({
        type: 'TSTypeReference',
        typeName: TsestreeStub({
          type: 'MemberExpression',
        }),
      });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBeNull();
    });

    it('EDGE: {type: TSTypeReference with Identifier but no name} => returns null', () => {
      const typeAnnotation = TsestreeStub({
        type: 'TSTypeReference',
        typeName: TsestreeStub({
          type: 'Identifier',
          name: undefined,
        }),
      });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBeNull();
    });

    it('EDGE: {type: unknown node type} => returns null', () => {
      const typeAnnotation = TsestreeStub({
        type: 'CallExpression',
      });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBeNull();
    });
  });
});
