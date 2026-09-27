/**
 * PURPOSE: Extracts every `<name>Proxy` identifier a gateway subpath's testing barrel
 * (`packages/@gateway/<folder>/src/<subpath>/<subpath>.proxy.ts`) re-exports, paired with the path
 * each one re-exports from, relative to the subpath directory and with its leading `./` already
 * stripped (so a caller joins it onto `#gateway/<folder>/<subpath>/` with no further parsing).
 * enforce-proxy-child-creation uses the map's keys to tell a WRAPPED gateway export (needs a proxy)
 * from a PASS-THROUGH one (never has a proxy, per the gateway brief's "curated modules expose no
 * raw functions" / "pass-throughs need no setup"), and the matched value to point a caller at that
 * wrapper's own per-file proxy directly, without hand-maintaining a list that drifts as new
 * wrappers are added — the barrel is the one place both facts are already kept true.
 *
 * USAGE:
 * gatewayTestingBarrelProxyPathsTransformer({
 *   content: FileContentsStub({ value: "export { globProxy } from './glob/glob.proxy';" }),
 * });
 * // Returns a Map with the branded Identifier 'globProxy' -> the branded ModulePath 'glob/glob.proxy'
 */
import type { FileContents, Identifier, ModulePath } from '@dungeonmaster/shared/contracts';
import { identifierContract, modulePathContract } from '@dungeonmaster/shared/contracts';

const LEADING_RELATIVE_SEGMENT = './';

export const gatewayTestingBarrelProxyPathsTransformer = ({
  content,
}: {
  content: FileContents;
}): Map<Identifier, ModulePath> => {
  const paths = new Map<Identifier, ModulePath>();
  const exportRegex = /export\s*\{\s*([\w$]+)\s*\}\s*from\s*'([^']+)'/gu;

  let match = exportRegex.exec(content);
  while (match !== null) {
    const [, name, path] = match;
    if (name?.endsWith('Proxy') === true && path !== undefined) {
      const withoutLeadingDot = path.startsWith(LEADING_RELATIVE_SEGMENT)
        ? path.slice(LEADING_RELATIVE_SEGMENT.length)
        : path;
      paths.set(identifierContract.parse(name), modulePathContract.parse(withoutLeadingDot));
    }
    match = exportRegex.exec(content);
  }

  return paths;
};
