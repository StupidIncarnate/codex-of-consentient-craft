import { NewExpressionStub } from '#gateway/npm/typescript-eslint__utils/new-expression/new-expression.stub';
import { astObjectBrandAnchorTransformer } from './ast-object-brand-anchor-transformer';

// The receiver is a `new Shape()` because a stub finds the OUTERMOST node of a type first, and a
// `new` expression is the one node type in a call chain that appears only at its innermost end.
describe('astObjectBrandAnchorTransformer', () => {
  describe('an object with no brand', () => {
    it('VALID: {receiver alone} => anchors on the receiver itself', () => {
      const node = NewExpressionStub({ code: 'new Shape();' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(node);
    });

    it('VALID: {receiver.strict()} => anchors after the shape-level method', () => {
      const node = NewExpressionStub({ code: 'new Shape().strict();' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result?.range).toStrictEqual([0, 20]);
    });

    it('VALID: {receiver.extend().strict().optional()} => anchors before the wrapper', () => {
      const node = NewExpressionStub({ code: 'new Shape().extend().strict().optional();' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result?.range).toStrictEqual([0, 29]);
    });

    it('VALID: {receiver.optional().strict()} => a method after a wrapper does not move the anchor', () => {
      const node = NewExpressionStub({ code: 'new Shape().optional().strict();' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(node);
    });
  });

  describe('an object that already has a brand', () => {
    it('VALID: {receiver.brand()} => returns null', () => {
      const node = NewExpressionStub({ code: 'new Shape().brand();' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(null);
    });

    it('VALID: {receiver.strict().brand().optional()} => returns null', () => {
      const node = NewExpressionStub({ code: 'new Shape().strict().brand().optional();' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(null);
    });
  });

  describe('a node that is not the receiver of a call', () => {
    it('EDGE: {receiver.shape} => anchors on the receiver', () => {
      const node = NewExpressionStub({ code: 'new Shape().shape;' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(node);
    });
  });
});
