import { astCollectNodesTransformer } from './ast-collect-nodes-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astCollectNodesTransformer', () => {
  describe('descendants of the requested type', () => {
    it('VALID: {two properties in an object} => returns both, in source order', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        arguments: [
          {
            type: TsestreeNodeType.ObjectExpression,
            properties: [
              {
                type: TsestreeNodeType.Property,
                key: { type: TsestreeNodeType.Identifier, name: 'a' },
              },
              {
                type: TsestreeNodeType.Property,
                key: { type: TsestreeNodeType.Identifier, name: 'b' },
              },
            ],
          },
        ],
      });

      const result = astCollectNodesTransformer({ node, type: TsestreeNodeType.Property });

      expect(result).toStrictEqual([
        { type: 'Property', key: { type: 'Identifier', name: 'a' } },
        { type: 'Property', key: { type: 'Identifier', name: 'b' } },
      ]);
    });

    it('VALID: {a property nested in a property value} => returns the outer and the inner', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          {
            type: TsestreeNodeType.Property,
            key: { type: TsestreeNodeType.Identifier, name: 'outer' },
            value: {
              type: TsestreeNodeType.ObjectExpression,
              properties: [
                {
                  type: TsestreeNodeType.Property,
                  key: { type: TsestreeNodeType.Identifier, name: 'inner' },
                },
              ],
            },
          },
        ],
      });

      const result = astCollectNodesTransformer({ node, type: TsestreeNodeType.Property });

      expect(result).toStrictEqual([
        {
          type: 'Property',
          key: { type: 'Identifier', name: 'outer' },
          value: {
            type: 'ObjectExpression',
            properties: [{ type: 'Property', key: { type: 'Identifier', name: 'inner' } }],
          },
        },
        { type: 'Property', key: { type: 'Identifier', name: 'inner' } },
      ]);
    });

    it('VALID: {a spread in an object} => returns the spread with its argument', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ObjectExpression,
        properties: [
          {
            type: TsestreeNodeType.SpreadElement,
            argument: { type: TsestreeNodeType.Identifier, name: 'x' },
          },
        ],
      });

      const result = astCollectNodesTransformer({ node, type: TsestreeNodeType.SpreadElement });

      expect(result).toStrictEqual([
        { type: 'SpreadElement', argument: { type: 'Identifier', name: 'x' } },
      ]);
    });
  });

  describe('nothing to collect', () => {
    it('EMPTY: {no node of the type below} => returns an empty list', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: { type: TsestreeNodeType.Identifier, name: 'f' },
      });

      const result = astCollectNodesTransformer({ node, type: TsestreeNodeType.Property });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {the root node itself has the type} => the root is not part of its own descendants', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.Property });

      const result = astCollectNodesTransformer({ node, type: TsestreeNodeType.Property });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {a parent link back up the tree} => never followed, so the walk ends', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.ObjectExpression });
      const child = TsestreeStub({ type: TsestreeNodeType.Property });
      node.properties = [child];
      child.parent = node;

      const result = astCollectNodesTransformer({ node, type: TsestreeNodeType.ObjectExpression });

      expect(result).toStrictEqual([]);
    });
  });
});
