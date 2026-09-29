import { isAstShapeReuseCheckGuard } from './is-ast-shape-reuse-check-guard';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

const identifier = ({ name }: { name: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({ type: TsestreeNodeType.Identifier, name });

const shapeKeyCall = ({ method }: { method: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.CallExpression,
    callee: TsestreeStub({
      type: TsestreeNodeType.MemberExpression,
      object: TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: identifier({ name: 'userContract' }),
          property: identifier({ name: 'shape' }),
        }),
        property: identifier({ name: 'id' }),
      }),
      property: identifier({ name: method }),
    }),
  });

describe('isAstShapeReuseCheckGuard', () => {
  describe('a check chained on a reused field', () => {
    it.each(['min', 'max', 'regex', 'brand', 'refine'])(
      'VALID: {userContract.shape.id.%s()} => returns true',
      (method) => {
        const node = shapeKeyCall({ method });

        expect(isAstShapeReuseCheckGuard({ node })).toBe(true);
      },
    );
  });

  describe('a wrapper on a reused field', () => {
    it.each(zodObjectBrandStatics.reuseModifiers)(
      'VALID: {userContract.shape.id.%s()} => returns false',
      (method) => {
        const node = shapeKeyCall({ method });

        expect(isAstShapeReuseCheckGuard({ node })).toBe(false);
      },
    );
  });

  describe('a call that is not on a reused field', () => {
    it('VALID: {z.string().min(1)} => returns false', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({
            type: TsestreeNodeType.CallExpression,
            callee: TsestreeStub({
              type: TsestreeNodeType.MemberExpression,
              object: identifier({ name: 'z' }),
              property: identifier({ name: 'string' }),
            }),
          }),
          property: identifier({ name: 'min' }),
        }),
      });

      expect(isAstShapeReuseCheckGuard({ node })).toBe(false);
    });

    it('VALID: {userContract.optional()} => returns false', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: identifier({ name: 'userContract' }),
          property: identifier({ name: 'optional' }),
        }),
      });

      expect(isAstShapeReuseCheckGuard({ node })).toBe(false);
    });

    it('VALID: {a plain function call} => returns false', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: identifier({ name: 'run' }),
      });

      expect(isAstShapeReuseCheckGuard({ node })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstShapeReuseCheckGuard({})).toBe(false);
    });
  });
});
