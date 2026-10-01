import { ImportClauseStub } from '#gateway/npm/typescript/import-clause/import-clause.stub';

import { isTypeOnlyImportClauseGuard } from './is-type-only-import-clause-guard';

describe('isTypeOnlyImportClauseGuard', () => {
  describe('a clause TypeScript 6 parsed', () => {
    it("VALID: {import type { X } from 'x'} => returns true", () => {
      const clause = ImportClauseStub({ code: "import type { X } from 'x';" });

      expect(isTypeOnlyImportClauseGuard({ clause })).toBe(true);
    });

    it("VALID: {import { X } from 'x'} => returns false", () => {
      const clause = ImportClauseStub({ code: "import { X } from 'x';" });

      expect(isTypeOnlyImportClauseGuard({ clause })).toBe(false);
    });

    it("VALID: {import defer * as X from 'x'} => returns false", () => {
      const clause = ImportClauseStub({ code: "import defer * as X from 'x';" });

      expect(isTypeOnlyImportClauseGuard({ clause })).toBe(false);
    });
  });

  describe('a clause TypeScript 5 parsed, with no phaseModifier', () => {
    it("VALID: {import type { X } from 'x'} => returns true", () => {
      const clause = ImportClauseStub({
        code: "import type { X } from 'x';",
        parsedByTypescript5: true,
      });

      expect(isTypeOnlyImportClauseGuard({ clause })).toBe(true);
    });

    it("VALID: {import { X } from 'x'} => returns false", () => {
      const clause = ImportClauseStub({
        code: "import { X } from 'x';",
        parsedByTypescript5: true,
      });

      expect(isTypeOnlyImportClauseGuard({ clause })).toBe(false);
    });
  });

  describe('no clause', () => {
    it('EMPTY: {clause: undefined} => returns false', () => {
      expect(isTypeOnlyImportClauseGuard({})).toBe(false);
    });
  });
});
