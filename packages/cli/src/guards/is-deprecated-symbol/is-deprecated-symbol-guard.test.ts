import { ExportSymbolStub } from '#gateway/npm/typescript/export-symbol/export-symbol.stub';

import { isDeprecatedSymbolGuard } from './is-deprecated-symbol-guard';

describe('isDeprecatedSymbolGuard', () => {
  describe('a declaration read directly', () => {
    it('VALID: {an export tagged @deprecated} => returns true', () => {
      const { symbol, checker } = ExportSymbolStub({
        code: '/** @deprecated use fresh */\nexport const old = 1;\n',
        name: 'old',
      });

      expect(isDeprecatedSymbolGuard({ symbol, checker })).toBe(true);
    });

    it('VALID: {an export with JSDoc but no @deprecated tag} => returns false', () => {
      const { symbol, checker } = ExportSymbolStub({
        code: '/** The current one. */\nexport const fresh = 1;\n',
        name: 'fresh',
      });

      expect(isDeprecatedSymbolGuard({ symbol, checker })).toBe(false);
    });
  });

  describe('an alias', () => {
    it('VALID: {a renamed export of a @deprecated declaration} => follows the alias and returns true', () => {
      const { symbol, checker } = ExportSymbolStub({
        code: '/** @deprecated */\nconst real = 1;\nexport { real as renamed };\n',
        name: 'renamed',
      });

      expect(isDeprecatedSymbolGuard({ symbol, checker })).toBe(true);
    });

    it('VALID: {a renamed export of an untagged declaration} => returns false', () => {
      const { symbol, checker } = ExportSymbolStub({
        code: 'const real = 1;\nexport { real as renamed };\n',
        name: 'renamed',
      });

      expect(isDeprecatedSymbolGuard({ symbol, checker })).toBe(false);
    });
  });

  describe('missing inputs', () => {
    it('EMPTY: {symbol: undefined} => returns false', () => {
      const { checker } = ExportSymbolStub();

      expect(isDeprecatedSymbolGuard({ checker })).toBe(false);
    });

    it('EMPTY: {checker: undefined} => returns false', () => {
      const { symbol } = ExportSymbolStub();

      expect(isDeprecatedSymbolGuard({ symbol })).toBe(false);
    });
  });
});
