import { isJsxStructuralChildGuard } from './is-jsx-structural-child-guard';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('isJsxStructuralChildGuard', () => {
  describe('structural children', () => {
    it('VALID: {child: JSXElement} => returns true', () => {
      const child = TsestreeStub({ type: TsestreeNodeType.JSXElement });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {child: JSXFragment} => returns true', () => {
      const child = TsestreeStub({ type: TsestreeNodeType.JSXFragment });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {container wrapping an element} => returns true', () => {
      const child = TsestreeStub({
        type: TsestreeNodeType.JSXExpressionContainer,
        expression: TsestreeStub({ type: TsestreeNodeType.JSXElement }),
      });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {container wrapping a ternary whose consequent is an element} => returns true', () => {
      const child = TsestreeStub({
        type: TsestreeNodeType.JSXExpressionContainer,
        expression: TsestreeStub({
          type: TsestreeNodeType.ConditionalExpression,
          consequent: TsestreeStub({ type: TsestreeNodeType.JSXElement }),
          alternate: TsestreeStub({ type: TsestreeNodeType.Literal }),
        }),
      });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {container wrapping a ternary whose ALTERNATE is an element} => returns true', () => {
      const child = TsestreeStub({
        type: TsestreeNodeType.JSXExpressionContainer,
        expression: TsestreeStub({
          type: TsestreeNodeType.ConditionalExpression,
          consequent: TsestreeStub({ type: TsestreeNodeType.Literal }),
          alternate: TsestreeStub({ type: TsestreeNodeType.JSXElement }),
        }),
      });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });

    it('VALID: {container wrapping cond && <El/>} => returns true', () => {
      const child = TsestreeStub({
        type: TsestreeNodeType.JSXExpressionContainer,
        expression: TsestreeStub({
          type: TsestreeNodeType.LogicalExpression,
          right: TsestreeStub({ type: TsestreeNodeType.JSXElement }),
        }),
      });

      expect(isJsxStructuralChildGuard({ child })).toBe(true);
    });
  });

  describe('leaf children', () => {
    it('INVALID: {child: JSXText} => returns false', () => {
      const child = TsestreeStub({ type: TsestreeNodeType.JSXText });

      expect(isJsxStructuralChildGuard({ child })).toBe(false);
    });

    it('INVALID: {container wrapping an identifier} => returns false', () => {
      const child = TsestreeStub({
        type: TsestreeNodeType.JSXExpressionContainer,
        expression: TsestreeStub({ type: TsestreeNodeType.Identifier }),
      });

      expect(isJsxStructuralChildGuard({ child })).toBe(false);
    });

    it('INVALID: {container wrapping a ternary between two values} => returns false', () => {
      const child = TsestreeStub({
        type: TsestreeNodeType.JSXExpressionContainer,
        expression: TsestreeStub({
          type: TsestreeNodeType.ConditionalExpression,
          consequent: TsestreeStub({ type: TsestreeNodeType.Literal }),
          alternate: TsestreeStub({ type: TsestreeNodeType.Literal }),
        }),
      });

      expect(isJsxStructuralChildGuard({ child })).toBe(false);
    });

    it('EMPTY: {container with no expression} => returns false', () => {
      const child = TsestreeStub({ type: TsestreeNodeType.JSXExpressionContainer });

      expect(isJsxStructuralChildGuard({ child })).toBe(false);
    });

    it('EMPTY: {child: undefined} => returns false', () => {
      expect(isJsxStructuralChildGuard({})).toBe(false);
    });
  });
});
