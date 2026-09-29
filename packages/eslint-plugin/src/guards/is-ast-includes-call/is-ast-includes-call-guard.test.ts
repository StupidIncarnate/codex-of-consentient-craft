import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isAstIncludesCallGuard } from './is-ast-includes-call-guard';

describe('isAstIncludesCallGuard', () => {
  describe('.includes() calls', () => {
    it('VALID: {node: str.includes(x)} => returns true', () => {
      const node = CallExpressionStub({ code: 'str.includes();' });

      expect(isAstIncludesCallGuard({ node })).toBe(true);
    });
  });

  describe('non-.includes() calls', () => {
    it('INVALID: {node: str.startsWith(x)} => returns false', () => {
      const node = CallExpressionStub({ code: 'str.startsWith();' });

      expect(isAstIncludesCallGuard({ node })).toBe(false);
    });

    it('INVALID: {node: Identifier} => returns false', () => {
      const node = IdentifierStub({ code: 'includes;' });

      expect(isAstIncludesCallGuard({ node })).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstIncludesCallGuard({})).toBe(false);
    });
  });
});
