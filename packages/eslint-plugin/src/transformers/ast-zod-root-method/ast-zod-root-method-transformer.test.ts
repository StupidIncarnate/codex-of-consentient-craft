import { astZodRootMethodTransformer } from './ast-zod-root-method-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

const identifier = ({ name }: { name: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({ type: TsestreeNodeType.Identifier, name });

const callOn = ({
  receiver,
  method,
}: {
  receiver: ReturnType<typeof TsestreeStub>;
  method: string;
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.CallExpression,
    callee: TsestreeStub({
      type: TsestreeNodeType.MemberExpression,
      object: receiver,
      property: identifier({ name: method }),
    }),
  });

describe('astZodRootMethodTransformer', () => {
  describe('a chain that starts on z', () => {
    it("VALID: {z.string().min(1).brand()} => returns 'string'", () => {
      const node = callOn({
        receiver: callOn({
          receiver: callOn({ receiver: identifier({ name: 'z' }), method: 'string' }),
          method: 'min',
        }),
        method: 'brand',
      });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('string');
    });

    it("VALID: {z.object({}).brand()} => returns 'object'", () => {
      const node = callOn({
        receiver: callOn({ receiver: identifier({ name: 'z' }), method: 'object' }),
        method: 'brand',
      });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('object');
    });

    it("VALID: {z.enum([]).brand()} => returns 'enum'", () => {
      const node = callOn({
        receiver: callOn({ receiver: identifier({ name: 'z' }), method: 'enum' }),
        method: 'brand',
      });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('enum');
    });

    it("VALID: {z.object({}).extend({}).brand()} => returns 'derive'", () => {
      const node = callOn({
        receiver: callOn({
          receiver: callOn({ receiver: identifier({ name: 'z' }), method: 'object' }),
          method: 'extend',
        }),
        method: 'brand',
      });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('derive');
    });
  });

  describe('a chain that starts elsewhere', () => {
    it("VALID: {userContract.pick({}).brand()} => returns 'derive'", () => {
      const node = callOn({
        receiver: callOn({ receiver: identifier({ name: 'userContract' }), method: 'pick' }),
        method: 'brand',
      });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('derive');
    });

    it('EMPTY: {userContract.optional()} => returns null', () => {
      const node = callOn({ receiver: identifier({ name: 'userContract' }), method: 'optional' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {questContract.shape.id.min(5)} => returns null', () => {
      const node = callOn({
        receiver: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: identifier({ name: 'questContract' }),
            property: identifier({ name: 'shape' }),
          }),
          property: identifier({ name: 'id' }),
        }),
        method: 'min',
      });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {a node that is not a call} => returns null', () => {
      const node = identifier({ name: 'z' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
