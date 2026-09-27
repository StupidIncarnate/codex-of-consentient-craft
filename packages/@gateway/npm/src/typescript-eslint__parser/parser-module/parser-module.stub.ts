/**
 * PURPOSE: The real `@typescript-eslint/parser` module, unchanged — this package is meant to be
 * handed to ESLint's own `Linter` as `languageOptions.parser` (see this gateway's own
 * `RuleContextStub`, which does exactly that), not called directly: calling its own `parse()`
 * resolves to TypeScript's internal `error` type under this package's own type-aware lint pass
 * (confirmed by G17's `parseAndFindNode`, which uses `@typescript-eslint/typescript-estree`'s own
 * `parse` instead for exactly this reason). There is nothing more real to construct beyond the
 * module itself.
 *
 * USAGE:
 * const parser = ParserModuleStub();
 * // Returns the real @typescript-eslint/parser module object
 */
import * as parser from '@typescript-eslint/parser';

export const ParserModuleStub = (): typeof parser => parser;
