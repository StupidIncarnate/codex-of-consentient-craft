/**
 * PURPOSE: Whether an installed package's CommonJS runtime module carries its own `default` key —
 * the fact a passthrough's `export { default }` line must agree with, since its key-parity test
 * compares the barrel's runtime keys against `require(<package>)`'s. Types alone mislead: undici's
 * declarations have `export default`, its runtime module has no `default`. The package is required
 * from the consumer's repo root. Null when loading it throws (a missing peer, a native build that
 * never compiled, an ESM-only entry): the caller falls back to what the types say.
 *
 * USAGE:
 * runtimeDefaultLayerBroker({ repoRoot: '/repo', packageName: 'undici' });
 * // Returns false — require('undici') has no own `default`
 */

import { createRequire } from '#gateway/node/module';
import { join } from '#gateway/node/path';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';

const RESOLUTION_ANCHOR_FILE = 'package.json';
const DEFAULT_EXPORT_NAME = 'default';

export const runtimeDefaultLayerBroker = ({
  repoRoot,
  packageName,
}: {
  repoRoot: string;
  packageName: GatewayNpmDependency['name'];
}): boolean | null => {
  const requireFromRepo = createRequire(join(repoRoot, RESOLUTION_ANCHOR_FILE));
  try {
    const runtimeModule: unknown = requireFromRepo(packageName);
    const isObjectLike =
      (typeof runtimeModule === 'object' && runtimeModule !== null) ||
      typeof runtimeModule === 'function';
    return isObjectLike && Object.hasOwn(runtimeModule, DEFAULT_EXPORT_NAME);
  } catch {
    // Not loadable here is an answer, not a failure of the sync: the declarations still decide.
    return null;
  }
};
