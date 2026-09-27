/**
 * PURPOSE: Extracts every name a gateway subpath's own production barrel
 * (`packages/@gateway/<folder>/src/<subpath>/<subpath>.ts`) re-exports from a wrapper folder ONE
 * level below it (`export { readFile } from './read-file/read-file'`), paired with that wrapper's own
 * relative module path, leading `./` stripped, so a caller joins it onto `#gateway/<folder>/<subpath>/`
 * with no further parsing and appends `.proxy` for the wrapper's own proxy file. Only a bare `./` match —
 * a name the barrel re-exports through `export * from '<npm-or-node-module>'` (a pass-through, no local
 * wrapper) or through a `../` climb into a DIFFERENT subpath's own folder (a convenience re-export,
 * whose proxy is that OTHER subpath's own concern — `fs__promises.ts` re-exports `isFsError` from
 * `../fs/is-fs-error/is-fs-error`, but `isFsErrorProxy` lives in `fs`'s own barrel, `fs.proxy.ts`, not
 * `fs__promises`'s) never appears here. This is exactly how enforce-proxy-child-creation tells a
 * WRAPPED gateway export from a pass-through one now that no `_test_` barrel exists to read instead —
 * the production barrel is the one place both facts already live, since a barrel line either names a
 * wrapper folder inside its OWN subpath or it does not.
 *
 * USAGE:
 * gatewayBarrelWrapperPathsTransformer({
 *   content: FileContentsStub({ value: "export { readFileIfExists } from './read-file-if-exists/read-file-if-exists';" }),
 * });
 * // Returns a Map with the branded Identifier 'readFileIfExists' -> the branded ModulePath
 * // 'read-file-if-exists/read-file-if-exists'
 */
import type { FileContents, Identifier, ModulePath } from '@dungeonmaster/shared/contracts';
import { identifierContract, modulePathContract } from '@dungeonmaster/shared/contracts';

const LEADING_RELATIVE_SEGMENT = './';

export const gatewayBarrelWrapperPathsTransformer = ({
  content,
}: {
  content: FileContents;
}): Map<Identifier, ModulePath> => {
  const paths = new Map<Identifier, ModulePath>();
  const exportRegex = /export\s*\{\s*([\w$]+)\s*\}\s*from\s*'(\.\/[^']+)'/gu;

  let match = exportRegex.exec(content);
  while (match !== null) {
    const [, name, path] = match;
    if (name !== undefined && path !== undefined) {
      const withoutLeadingDot = path.startsWith(LEADING_RELATIVE_SEGMENT)
        ? path.slice(LEADING_RELATIVE_SEGMENT.length)
        : path;
      paths.set(identifierContract.parse(name), modulePathContract.parse(withoutLeadingDot));
    }
    match = exportRegex.exec(content);
  }

  return paths;
};
