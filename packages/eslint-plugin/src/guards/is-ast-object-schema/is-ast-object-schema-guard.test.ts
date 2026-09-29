import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { isAstObjectSchemaGuard } from './is-ast-object-schema-guard';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

describe('isAstObjectSchemaGuard', () => {
  describe('an object root', () => {
    it.each(zodObjectBrandStatics.objectRoots)('VALID: {z.%s({})} => returns true', (method) => {
      const node = CallExpressionStub({ code: `z.${method}({});` });

      expect(isAstObjectSchemaGuard({ node })).toBe(true);
    });
  });

  describe('a derive call on another contract', () => {
    it.each(zodObjectBrandStatics.deriveMethods)(
      'VALID: {userContract.%s({})} => returns true',
      (method) => {
        const node = CallExpressionStub({ code: `userContract.${method}({});` });

        expect(isAstObjectSchemaGuard({ node })).toBe(true);
      },
    );
  });

  describe('a call that makes no new object', () => {
    it('VALID: {z.string()} => returns false', () => {
      const node = CallExpressionStub({ code: 'z.string();' });

      expect(isAstObjectSchemaGuard({ node })).toBe(false);
    });

    it('VALID: {userContract.optional()} => returns false', () => {
      const node = CallExpressionStub({ code: 'userContract.optional();' });

      expect(isAstObjectSchemaGuard({ node })).toBe(false);
    });

    it('VALID: {values.pick({})} => a receiver that is not a contract returns false', () => {
      const node = CallExpressionStub({ code: 'values.pick();' });

      expect(isAstObjectSchemaGuard({ node })).toBe(false);
    });

    it('VALID: {a plain function call} => returns false', () => {
      const node = CallExpressionStub({ code: 'run();' });

      expect(isAstObjectSchemaGuard({ node })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstObjectSchemaGuard({})).toBe(false);
    });
  });
});
