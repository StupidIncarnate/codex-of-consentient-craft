/**
 * PURPOSE: Extracts every `<name>Proxy` identifier a gateway package's testing barrel
 * (`packages/<folder>/src/testing/index.ts`) re-exports, so enforce-proxy-child-creation can tell
 * a WRAPPED gateway export (needs a proxy) from a PASS-THROUGH one (never has a proxy, per the
 * gateway brief's "curated modules expose no raw functions" / "pass-throughs need no setup")
 * without hand-maintaining a list of wrapped names that drifts as new wrappers are added — the
 * barrel is the one place that list is already kept true.
 *
 * USAGE:
 * gatewayTestingBarrelProxyNamesTransformer({
 *   content: FileContentsStub({ value: "export { globProxy } from '../glob/glob.proxy';" }),
 * });
 * // Returns a Set containing the branded Identifier 'globProxy'
 */
import type { FileContents, Identifier } from '@dungeonmaster/shared/contracts';
import { identifierContract } from '@dungeonmaster/shared/contracts';

export const gatewayTestingBarrelProxyNamesTransformer = ({
  content,
}: {
  content: FileContents;
}): Set<Identifier> => {
  const names = new Set<Identifier>();
  const exportRegex = /export\s*\{\s*([\w$]+)\s*\}/gu;

  let match = exportRegex.exec(content);
  while (match !== null) {
    const [, name] = match;
    if (name?.endsWith('Proxy') === true) {
      names.add(identifierContract.parse(name));
    }
    match = exportRegex.exec(content);
  }

  return names;
};
