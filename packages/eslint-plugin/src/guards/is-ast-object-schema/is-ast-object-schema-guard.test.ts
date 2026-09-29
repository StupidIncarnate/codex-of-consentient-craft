import { isAstObjectSchemaGuard } from './is-ast-object-schema-guard';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

const callOn = ({
  receiver,
  method,
}: {
  receiver: string;
  method: string;
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.CallExpression,
    callee: TsestreeStub({
      type: TsestreeNodeType.MemberExpression,
      object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: receiver }),
      property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: method }),
    }),
  });

describe('isAstObjectSchemaGuard', () => {
  describe('an object root', () => {
    it.each(zodObjectBrandStatics.objectRoots)('VALID: {z.%s({})} => returns true', (method) => {
      const node = callOn({ receiver: 'z', method });

      expect(isAstObjectSchemaGuard({ node })).toBe(true);
    });
  });

  describe('a derive call on another contract', () => {
    it.each(zodObjectBrandStatics.deriveMethods)(
      'VALID: {userContract.%s({})} => returns true',
      (method) => {
        const node = callOn({ receiver: 'userContract', method });

        expect(isAstObjectSchemaGuard({ node })).toBe(true);
      },
    );
  });

  describe('a call that makes no new object', () => {
    it('VALID: {z.string()} => returns false', () => {
      const node = callOn({ receiver: 'z', method: 'string' });

      expect(isAstObjectSchemaGuard({ node })).toBe(false);
    });

    it('VALID: {userContract.optional()} => returns false', () => {
      const node = callOn({ receiver: 'userContract', method: 'optional' });

      expect(isAstObjectSchemaGuard({ node })).toBe(false);
    });

    it('VALID: {values.pick({})} => a receiver that is not a contract returns false', () => {
      const node = callOn({ receiver: 'values', method: 'pick' });

      expect(isAstObjectSchemaGuard({ node })).toBe(false);
    });

    it('VALID: {a plain function call} => returns false', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'run' }),
      });

      expect(isAstObjectSchemaGuard({ node })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstObjectSchemaGuard({})).toBe(false);
    });
  });
});
