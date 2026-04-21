import { isClassifiedStatusLiteralElementGuard } from './is-classified-status-literal-element-guard';
import {
  TsestreeStub,
  TsestreeNodeType,
} from '@dungeonmaster/eslint-plugin/contracts/tsestree.stub';

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
          element: TsestreeStub({ type: TsestreeNodeType.Identifier }),
        }),
      ).toBe(false);
    });
  });

  describe('non-string Literal', () => {
    it('EMPTY: {element: Literal with numeric value} => returns false', () => {
      expect(
        isClassifiedStatusLiteralElementGuard({
          element: TsestreeStub({ type: TsestreeNodeType.Literal, value: 0 }),
        }),
      ).toBe(false);
    });
  });

  describe('status-literal string', () => {
    it.each(['seek_scope', 'in_progress', 'approved', 'failed', 'complete', 'pending'] as const)(
      'VALID: {element: Literal(%s)} => returns true',
      (value) => {
        expect(
          isClassifiedStatusLiteralElementGuard({
            element: TsestreeStub({ type: TsestreeNodeType.Literal, value }),
          }),
        ).toBe(true);
      },
    );
  });

  describe('unrelated string literal', () => {
    it('EMPTY: {element: Literal("hello")} => returns false', () => {
      expect(
        isClassifiedStatusLiteralElementGuard({
          element: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'hello' }),
        }),
      ).toBe(false);
    });
  });
});
