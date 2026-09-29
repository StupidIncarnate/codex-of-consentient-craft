import { astObjectBrandAnchorTransformer } from './ast-object-brand-anchor-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

// Builds `receiver.method(…)` with the parent links a real ESLint tree carries, so the transformer
// can walk up from the receiver to the call.
const chainOnto = ({
  receiver,
  method,
}: {
  receiver: ReturnType<typeof TsestreeStub>;
  method: string;
}): ReturnType<typeof TsestreeStub> => {
  const member = TsestreeStub({
    type: TsestreeNodeType.MemberExpression,
    property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: method }),
  });
  const call = TsestreeStub({ type: TsestreeNodeType.CallExpression });
  member.object = receiver;
  receiver.parent = member;
  call.callee = member;
  member.parent = call;
  return call;
};

describe('astObjectBrandAnchorTransformer', () => {
  describe('an object with no brand', () => {
    it('VALID: {z.object({})} => anchors on the object call itself', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(node);
    });

    it('VALID: {z.object({}).strict()} => anchors after the shape-level method', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const strict = chainOnto({ receiver: node, method: 'strict' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(strict);
    });

    it('VALID: {z.object({}).extend({}).strict().optional()} => anchors before the wrapper', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const extend = chainOnto({ receiver: node, method: 'extend' });
      const strict = chainOnto({ receiver: extend, method: 'strict' });
      chainOnto({ receiver: strict, method: 'optional' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(strict);
    });

    it('VALID: {z.object({}).optional().strict()} => a method after a wrapper does not move the anchor', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const optional = chainOnto({ receiver: node, method: 'optional' });
      chainOnto({ receiver: optional, method: 'strict' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(node);
    });
  });

  describe('an object that already has a brand', () => {
    it('VALID: {z.object({}).brand()} => returns null', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      chainOnto({ receiver: node, method: 'brand' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(null);
    });

    it('VALID: {z.object({}).strict().brand().optional()} => returns null', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const strict = chainOnto({ receiver: node, method: 'strict' });
      const brand = chainOnto({ receiver: strict, method: 'brand' });
      chainOnto({ receiver: brand, method: 'optional' });

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(null);
    });
  });

  describe('a node that is not the receiver of a call', () => {
    it('EDGE: {z.object({}).shape} => anchors on the object call', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const member = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'shape' }),
      });
      member.object = node;
      node.parent = member;

      const result = astObjectBrandAnchorTransformer({ node });

      expect(result).toBe(node);
    });
  });
});
