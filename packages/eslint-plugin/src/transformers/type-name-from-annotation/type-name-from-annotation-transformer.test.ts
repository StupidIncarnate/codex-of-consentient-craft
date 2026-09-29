import { TSTypeAnnotationStub } from '#gateway/npm/typescript-eslint__utils/ts-type-annotation/ts-type-annotation.stub';
import { TSArrayTypeStub } from '#gateway/npm/typescript-eslint__utils/ts-array-type/ts-array-type.stub';
import { TSTypeReferenceStub } from '#gateway/npm/typescript-eslint__utils/ts-type-reference/ts-type-reference.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { typeNameFromAnnotationTransformer } from './type-name-from-annotation-transformer';

describe('typeNameFromAnnotationTransformer', () => {
  describe('valid input', () => {
    it('VALID: {type: TSTypeAnnotation with TSTypeReference} => returns type name', () => {
      const typeAnnotation = TSTypeAnnotationStub({ code: 'let x: User;' });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe('User');
    });

    it('VALID: {type: TSTypeReference with Identifier} => returns type name', () => {
      const typeAnnotation = TSTypeReferenceStub({ code: 'let x: Widget;' });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe('Widget');
    });

    it('VALID: {type: TSArrayType} => returns element type name', () => {
      const typeAnnotation = TSArrayTypeStub({ code: 'let x: User[];' });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe('User');
    });

    it('VALID: {type: TSTypeReference with generic Array<T>} => returns Array', () => {
      const typeAnnotation = TSTypeReferenceStub({ code: 'let x: Array;' });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe('Array');
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns null', () => {
      const result = typeNameFromAnnotationTransformer({});

      expect(result).toBe(null);
    });

    it('EMPTY: {typeAnnotation: null} => returns null', () => {
      const result = typeNameFromAnnotationTransformer({ typeAnnotation: null });

      expect(result).toBe(null);
    });

    it('EDGE: {type: TSTypeReference with non-Identifier typeName} => returns null', () => {
      const typeAnnotation = TSTypeReferenceStub({ code: 'let x: Namespace.User;' });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe(null);
    });

    it('EDGE: {type: unknown node type} => returns null', () => {
      const typeAnnotation = CallExpressionStub({ code: 'f();' });

      const result = typeNameFromAnnotationTransformer({ typeAnnotation });

      expect(result).toBe(null);
    });
  });
});
