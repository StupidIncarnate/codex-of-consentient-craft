import { astCallMethodNameTransformer } from './ast-call-method-name-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astCallMethodNameTransformer', () => {
  describe('a call on a member access', () => {
    it("VALID: {z.string().brand()} => returns 'brand'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.CallExpression }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'brand' }),
        }),
      });

      const result = astCallMethodNameTransformer({ node });

      expect(result).toBe('brand');
    });
  });

  describe('a call on anything else', () => {
    it('EMPTY: {run()} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'run' }),
      });

      const result = astCallMethodNameTransformer({ node });

      expect(result).toBe(null);
    });

    it("EMPTY: {object['key']()} => a computed property is not a method name", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'object' }),
          property: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'key' }),
        }),
      });

      const result = astCallMethodNameTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
