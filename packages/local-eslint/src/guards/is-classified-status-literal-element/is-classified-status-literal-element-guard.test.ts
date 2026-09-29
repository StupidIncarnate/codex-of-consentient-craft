import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { isClassifiedStatusLiteralElementGuard } from './is-classified-status-literal-element-guard';

describe('isClassifiedStatusLiteralElementGuard', () => {
  describe('missing element', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isClassifiedStatusLiteralElementGuard({})).toBe(false);
    });

    it('EMPTY: {element: null} => returns false', () => {
      expect(isClassifiedStatusLiteralElementGuard({ element: null })).toBe(false);
    });
  });

  describe('non-literal element', () => {
    it('EMPTY: {element: Identifier} => returns false', () => {
      expect(
        isClassifiedStatusLiteralElementGuard({
          element: IdentifierStub({ code: 'x;' }),
        }),
      ).toBe(false);
    });
  });

  describe('non-string Literal', () => {
    it('EMPTY: {element: Literal with numeric value} => returns false', () => {
      expect(
        isClassifiedStatusLiteralElementGuard({
          element: LiteralStub({ code: 'const l = 0;' }),
        }),
      ).toBe(false);
    });
  });

  describe('status-literal string', () => {
    it.each(['blocked', 'in_progress', 'approved', 'failed', 'complete', 'pending'] as const)(
      'VALID: {element: Literal(%s)} => returns true',
      (value) => {
        expect(
          isClassifiedStatusLiteralElementGuard({
            element: LiteralStub({ code: `const l = "${value}";` }),
          }),
        ).toBe(true);
      },
    );
  });

  describe('unrelated string literal', () => {
    it('EMPTY: {element: Literal("hello")} => returns false', () => {
      expect(
        isClassifiedStatusLiteralElementGuard({
          element: LiteralStub({ code: 'const l = "hello";' }),
        }),
      ).toBe(false);
    });
  });
});
