import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { ObjectExpressionStub } from '#gateway/npm/typescript-eslint__utils/object-expression/object-expression.stub';
import { PropertyStub } from '#gateway/npm/typescript-eslint__utils/property/property.stub';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import { astCollectNodesTransformer } from './ast-collect-nodes-transformer';

describe('astCollectNodesTransformer', () => {
  describe('descendants of the requested type', () => {
    it('VALID: {two properties in an object} => returns both, in source order', () => {
      const code = 'f({ a: v, b: v });';
      const node = CallExpressionStub({ code });

      const result = astCollectNodesTransformer({ node, type: AST_NODE_TYPES.Property });

      expect(
        result.map((found) => ({ type: found.type, text: code.slice(...found.range) })),
      ).toStrictEqual([
        { type: 'Property', text: 'a: v' },
        { type: 'Property', text: 'b: v' },
      ]);
    });

    it('VALID: {a property nested in a property value} => returns the outer and the inner', () => {
      const code = 'const o = { outer: { inner: v } };';
      const node = ObjectExpressionStub({ code });

      const result = astCollectNodesTransformer({ node, type: AST_NODE_TYPES.Property });

      expect(
        result.map((found) => ({ type: found.type, text: code.slice(...found.range) })),
      ).toStrictEqual([
        { type: 'Property', text: 'outer: { inner: v }' },
        { type: 'Property', text: 'inner: v' },
      ]);
    });

    it('VALID: {a spread in an object} => returns the spread with its argument', () => {
      const code = 'const o = { ...x };';
      const node = ObjectExpressionStub({ code });

      const result = astCollectNodesTransformer({ node, type: AST_NODE_TYPES.SpreadElement });

      expect(
        result.map((found) => ({ type: found.type, text: code.slice(...found.range) })),
      ).toStrictEqual([{ type: 'SpreadElement', text: '...x' }]);
    });
  });

  describe('nothing to collect', () => {
    it('EMPTY: {no node of the type below} => returns an empty list', () => {
      const node = CallExpressionStub({ code: 'f();' });

      const result = astCollectNodesTransformer({ node, type: AST_NODE_TYPES.Property });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {the root node itself has the type} => the root is not part of its own descendants', () => {
      const node = PropertyStub({ code: 'const o = { a: v };' });

      const result = astCollectNodesTransformer({ node, type: AST_NODE_TYPES.Property });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {a parent link back up the tree} => never followed, so the walk ends', () => {
      const node = ObjectExpressionStub({ code: 'const o = {  };' });
      const child = PropertyStub({ code: 'const o = { a: v };' });
      node.properties = [child];
      child.parent = node;

      const result = astCollectNodesTransformer({ node, type: AST_NODE_TYPES.ObjectExpression });

      expect(result).toStrictEqual([]);
    });
  });
});
