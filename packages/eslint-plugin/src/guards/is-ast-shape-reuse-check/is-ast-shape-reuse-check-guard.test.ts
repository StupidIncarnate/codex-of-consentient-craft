import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { isAstShapeReuseCheckGuard } from './is-ast-shape-reuse-check-guard';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

describe('isAstShapeReuseCheckGuard', () => {
  describe('a check chained on a reused field', () => {
    it.each(['min', 'max', 'regex', 'brand', 'refine'])(
      'VALID: {userContract.shape.id.%s()} => returns true',
      (method) => {
        const node = CallExpressionStub({ code: `userContract.shape.id.${method}();` });

        expect(isAstShapeReuseCheckGuard({ node })).toBe(true);
      },
    );
  });

  describe('a wrapper on a reused field', () => {
    it.each(zodObjectBrandStatics.reuseModifiers)(
      'VALID: {userContract.shape.id.%s()} => returns false',
      (method) => {
        const node = CallExpressionStub({ code: `userContract.shape.id.${method}();` });

        expect(isAstShapeReuseCheckGuard({ node })).toBe(false);
      },
    );
  });

  describe('a call that is not on a reused field', () => {
    it('VALID: {z.string().min(1)} => returns false', () => {
      const node = CallExpressionStub({ code: 'z.string().min();' });

      expect(isAstShapeReuseCheckGuard({ node })).toBe(false);
    });

    it('VALID: {userContract.optional()} => returns false', () => {
      const node = CallExpressionStub({ code: 'userContract.optional();' });

      expect(isAstShapeReuseCheckGuard({ node })).toBe(false);
    });

    it('VALID: {a plain function call} => returns false', () => {
      const node = CallExpressionStub({ code: 'run();' });

      expect(isAstShapeReuseCheckGuard({ node })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstShapeReuseCheckGuard({})).toBe(false);
    });
  });
});
