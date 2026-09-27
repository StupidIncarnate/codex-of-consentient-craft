/**
 * PURPOSE: Splits a `{ a, type B, c as d }` named-import clause into the VALUE names only — a
 * whole-clause `type` keyword is handled by the caller before this ever runs, so this drops only a
 * PER-NAME `type` prefix ('{ walkBroker, type WalkMemo }'). An `as`-aliased specifier keeps the part
 * BEFORE `as` (the SOURCE export name, e.g. `httpAdapter` out of `httpAdapter as httpClient`) — this
 * preserves the exact behavior every call site already had before this was factored out, since
 * enforce-proxy-child-creation derives its expected proxy NAME from the source export
 * (`${importedName}Proxy`), never from whatever local binding a caller happens to alias it to.
 * Factored out of parseImplementationImportsTransformer, which calls this identically from every
 * import shape it recognizes (gateway, workspace-package-root, scoped-package-subpath, relative)
 * rather than repeating the same split/filter chain at each call site.
 *
 * USAGE:
 * namedImportValueNamesTransformer({ namedImports: 'walkBroker, type WalkMemo' });
 * // Returns [IdentifierStub({ value: 'walkBroker' })] — a branded Identifier[]
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { identifierContract } from '@dungeonmaster/shared/contracts';

export const namedImportValueNamesTransformer = ({
  namedImports,
}: {
  namedImports: string;
}): Identifier[] =>
  namedImports
    .split(',')
    .map((specifierRaw) => {
      const specifier = specifierRaw.trim();
      // A per-name `type` prefix inside an otherwise-value import marks only THIS specifier
      // type-only, checked before the alias split since an alias never changes whether the
      // source name is a type.
      if (/^type\s+/u.test(specifier)) {
        return undefined;
      }
      const [trimmed] = specifier.split(/\s+as\s+/u);
      return trimmed;
    })
    .filter((name): name is Exclude<typeof name, undefined> => Boolean(name))
    .map((name) => identifierContract.parse(name));
