import { isAstGetterReturnTypeGuard } from './is-ast-getter-return-type-guard';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('isAstGetterReturnTypeGuard', () => {
  describe('inside a getter', () => {
    it('VALID: {type reference in the getter return annotation} => returns true', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.TSTypeReference });
      const annotation = TsestreeStub({ type: TsestreeNodeType.TSTypeAnnotation });
      const getter = TsestreeStub({ type: TsestreeNodeType.FunctionExpression });
      const property = TsestreeStub({ type: TsestreeNodeType.Property });
      node.parent = annotation;
      annotation.parent = getter;
      getter.returnType = annotation;
      getter.parent = property;

      expect(isAstGetterReturnTypeGuard({ node })).toBe(true);
    });

    it('VALID: {type reference nested inside the return annotation} => returns true', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.TSTypeReference });
      const outer = TsestreeStub({ type: TsestreeNodeType.TSTypeReference });
      const annotation = TsestreeStub({ type: TsestreeNodeType.TSTypeAnnotation });
      const getter = TsestreeStub({ type: TsestreeNodeType.FunctionExpression });
      const property = TsestreeStub({ type: TsestreeNodeType.Property });
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
      const node = TsestreeStub({ type: TsestreeNodeType.TSTypeReference });
      const body = TsestreeStub({ type: TsestreeNodeType.BlockStatement });
      const getter = TsestreeStub({ type: TsestreeNodeType.FunctionExpression });
      const property = TsestreeStub({ type: TsestreeNodeType.Property });
      node.parent = body;
      body.parent = getter;
      getter.parent = property;

      expect(isAstGetterReturnTypeGuard({ node })).toBe(false);
    });

    it('VALID: {return type of a function expression that is not a property value} => returns false', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.TSTypeReference });
      const annotation = TsestreeStub({ type: TsestreeNodeType.TSTypeAnnotation });
      const fn = TsestreeStub({ type: TsestreeNodeType.FunctionExpression });
      const declarator = TsestreeStub({ type: TsestreeNodeType.VariableDeclarator });
      node.parent = annotation;
      annotation.parent = fn;
      fn.returnType = annotation;
      fn.parent = declarator;

      expect(isAstGetterReturnTypeGuard({ node })).toBe(false);
    });

    it('VALID: {a field type annotation with no function above it} => returns false', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.TSTypeReference });
      const declarator = TsestreeStub({ type: TsestreeNodeType.VariableDeclarator });
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
