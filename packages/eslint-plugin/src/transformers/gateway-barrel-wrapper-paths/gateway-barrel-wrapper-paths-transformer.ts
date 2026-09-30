/**
 * PURPOSE: Extracts every name a barrel file re-exports from a relative sibling ONE line at a time
 * (`export { readFile } from './read-file/read-file'`), paired with that target's own relative
 * module path, leading `./` stripped. Only a bare `./` match — a name the barrel re-exports through
 * `export * from '<npm-or-node-module>'` (a pass-through, no local file) or through a `../` climb
 * into a DIFFERENT domain's own folder (a convenience re-export whose proxy is that OTHER domain's
 * concern — `fs__promises.ts` re-exports `isFsError` from `../fs/is-fs-error/is-fs-error`, but
 * `isFsErrorProxy` lives in `fs`'s own barrel, `fs.proxy.ts`, not `fs__promises`'s) — never appears
 * here. Two callers share it: a gateway subpath's own production barrel
 * (`packages/@gateway/<folder>/src/<subpath>/<subpath>.ts`), where the caller joins the result onto
 * `#gateway/<folder>/<subpath>/` and appends `.proxy` for the wrapper's own proxy file; and a
 * workspace package's own root barrel (`packages/<pkg>/src/index.ts`), where the caller joins the
 * result onto `@scope/<pkg>/` the same way. This is exactly how enforce-proxy-child-creation tells a
 * WRAPPED export from a pass-through one in both cases, now that no `_test_` barrel exists to read
 * instead — the production barrel is the one place both facts already live, since a barrel line
 * either names a sibling file or it does not.
 *
 * USAGE:
 * gatewayBarrelWrapperPathsTransformer({
 *   content: FileContentsStub({ value: "export { readFileIfExists } from './read-file-if-exists/read-file-if-exists';" }),
 * });
 * // Returns a Map with the branded Identifier 'readFileIfExists' -> the branded ModulePath
 * // 'read-file-if-exists/read-file-if-exists'
 */

const LEADING_RELATIVE_SEGMENT = './';

export const gatewayBarrelWrapperPathsTransformer = ({
  content,
}: {
  content: string;
}): Map<string, string> => {
  const paths = new Map<string, string>();
  const exportRegex = /export\s*\{\s*([\w$]+)\s*\}\s*from\s*'(\.\/[^']+)'/gu;

  let match = exportRegex.exec(content);
  while (match !== null) {
    const [, name, path] = match;
    if (name !== undefined && path !== undefined) {
      const withoutLeadingDot = path.startsWith(LEADING_RELATIVE_SEGMENT)
        ? path.slice(LEADING_RELATIVE_SEGMENT.length)
        : path;
      paths.set(name, withoutLeadingDot);
    }
    match = exportRegex.exec(content);
  }

  return paths;
};
