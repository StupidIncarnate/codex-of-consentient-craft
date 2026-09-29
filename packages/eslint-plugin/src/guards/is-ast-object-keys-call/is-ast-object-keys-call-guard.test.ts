import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isAstObjectKeysCallGuard } from './is-ast-object-keys-call-guard';

describe('isAstObjectKeysCallGuard', () => {
  describe('Object.keys calls', () => {
    it('VALID: {node: Object.keys(obj)} => returns true', () => {
      const node = CallExpressionStub({ code: 'Object.keys();' });

      expect(isAstObjectKeysCallGuard({ node })).toBe(true);
    });
  });

  describe('non-Object.keys calls', () => {
    it('INVALID: {node: Object.values(obj)} => returns false', () => {
      const node = CallExpressionStub({ code: 'Object.values();' });

      expect(isAstObjectKeysCallGuard({ node })).toBe(false);
    });

    it('INVALID: {node: Identifier} => returns false', () => {
      const node = IdentifierStub({ code: 'keys;' });

      expect(isAstObjectKeysCallGuard({ node })).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isAstObjectKeysCallGuard({})).toBe(false);
    });
  });
});
