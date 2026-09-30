/**
 * PURPOSE: Turns an import statement's named-import clause into `[Identifier, ModulePath]` entries
 * ready to merge into parseImplementationImportsTransformer's result map — one entry per value name
 * `namedImportValueNamesTransformer` keeps, each paired with the SAME import path. Reach for this
 * over calling `namedImportValueNamesTransformer` directly whenever the caller's only next step is
 * building that pair for every name; folding the "no named-import clause at all" check in here too
 * (returning `[]`) is what keeps every one of parseImplementationImportsTransformer's four import
 * shapes down to a single `for` over this call, rather than an `if` guarding it.
 *
 * USAGE:
 * namedImportEntriesTransformer({ namedImports: 'httpAdapter, type WalkMemo', importPath: '../http/http-adapter' });
 * // Returns [[IdentifierStub({ value: 'httpAdapter' }), ModulePathStub({ value: '../http/http-adapter' })]]
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { namedImportValueNamesTransformer } from '../named-import-value-names/named-import-value-names-transformer';

export const namedImportEntriesTransformer = ({
  namedImports,
  importPath,
}: {
  namedImports: string | undefined;
  importPath: string;
}): [Identifier, string][] =>
  namedImports === undefined
    ? []
    : namedImportValueNamesTransformer({ namedImports }).map((name): [Identifier, string] => [
        name,
        importPath,
      ]);
