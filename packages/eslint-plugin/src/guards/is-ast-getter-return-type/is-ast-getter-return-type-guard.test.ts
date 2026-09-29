import { TSTypeReferenceStub } from '#gateway/npm/typescript-eslint__utils/ts-type-reference/ts-type-reference.stub';
import { TSTypeAnnotationStub } from '#gateway/npm/typescript-eslint__utils/ts-type-annotation/ts-type-annotation.stub';
import { FunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/function-expression/function-expression.stub';
import { PropertyStub } from '#gateway/npm/typescript-eslint__utils/property/property.stub';
import { BlockStatementStub } from '#gateway/npm/typescript-eslint__utils/block-statement/block-statement.stub';
import { VariableDeclaratorStub } from '#gateway/npm/typescript-eslint__utils/variable-declarator/variable-declarator.stub';
import { isAstGetterReturnTypeGuard } from './is-ast-getter-return-type-guard';

describe('isAstGetterReturnTypeGuard', () => {
  describe('inside a getter', () => {
    it('VALID: {type reference in the getter return annotation} => returns true', () => {
      const node = TSTypeReferenceStub({ code: 'let x: T;' });
      const annotation = TSTypeAnnotationStub({ code: 'let x: unknown;' });
      const getter = FunctionExpressionStub({ code: 'const f = function () {};' });
      const property = PropertyStub({ code: 'const o = { a: v };' });
      node.parent = annotation;
      annotation.parent = getter;
      getter.returnType = annotation;
      getter.parent = property;

      expect(isAstGetterReturnTypeGuard({ node })).toBe(true);
    });

    it('VALID: {type reference nested inside the return annotation} => returns true', () => {
      const node = TSTypeReferenceStub({ code: 'let x: T;' });
      const outer = TSTypeReferenceStub({ code: 'let x: T;' });
      const annotation = TSTypeAnnotationStub({ code: 'let x: unknown;' });
      const getter = FunctionExpressionStub({ code: 'const f = function () {};' });
      const property = PropertyStub({ code: 'const o = { a: v };' });
      node.parent = outer;
      outer.parent = annotation;
      annotation.parent = getter;
      getter.returnType = annotation;
      getter.parent = property;

      expect(isAstGetterReturnTypeGuard({ node })).toBe(true);
    });
  });

  describe('not the return type of a getter', () => {
    it('VALID: {type reference in the getter body} => returns false', () => {
      const node = TSTypeReferenceStub({ code: 'let x: T;' });
      const body = BlockStatementStub({ code: '{  }' });
      const getter = FunctionExpressionStub({ code: 'const f = function () {};' });
      const property = PropertyStub({ code: 'const o = { a: v };' });
      node.parent = body;
      body.parent = getter;
      getter.parent = property;

      expect(isAstGetterReturnTypeGuard({ node })).toBe(false);
    });

    it('VALID: {return type of a function expression that is not a property value} => returns false', () => {
      const node = TSTypeReferenceStub({ code: 'let x: T;' });
      const annotation = TSTypeAnnotationStub({ code: 'let x: unknown;' });
      const fn = FunctionExpressionStub({ code: 'const f = function () {};' });
      const declarator = VariableDeclaratorStub({ code: 'const x;' });
      node.parent = annotation;
      annotation.parent = fn;
      fn.returnType = annotation;
      fn.parent = declarator;

      expect(isAstGetterReturnTypeGuard({ node })).toBe(false);
    });

    it('VALID: {a field type annotation with no function above it} => returns false', () => {
      const node = TSTypeReferenceStub({ code: 'let x: T;' });
      const declarator = VariableDeclaratorStub({ code: 'const x;' });
      node.parent = declarator;

      expect(isAstGetterReturnTypeGuard({ node })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstGetterReturnTypeGuard({})).toBe(false);
    });
  });
});
