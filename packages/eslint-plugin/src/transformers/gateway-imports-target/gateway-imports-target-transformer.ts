/**
 * PURPOSE: Matches a `#gateway/...` specifier against a package's own `imports` map the way Node's
 * subpath-imports pattern resolution does — an exact literal key first, then a single-star wildcard
 * key, substituting the captured remainder into the matched key's target. A conditions-object target
 * picks `source` first (this repo's own resolution condition, ahead of Node's real runtime
 * conditions), then `import`/`require`/`default`.
 *
 * USAGE:
 * gatewayImportsTargetTransformer({
 *   importsMap: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
 *   specifier: importPathContract.parse('#gateway/npm/zod'),
 * });
 * // Returns '@dungeonmaster/npm/zod' as branded ImportPath
 */
import { importPathContract } from '@dungeonmaster/shared/contracts';
import type { ImportPath } from '@dungeonmaster/shared/contracts';
import type { GatewayConsumerPackageJson } from '../../contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract';

export const gatewayImportsTargetTransformer = ({
  importsMap,
  specifier,
}: {
  importsMap: GatewayConsumerPackageJson['imports'];
  specifier: ImportPath;
}): ImportPath | null => {
  if (!importsMap) {
    return null;
  }

  let wildcardMatch: ImportPath | null = null;

  // Object.entries always yields plain string keys, even off a branded-key Record, so the literal
  // key comparison below stays a `===` rather than indexing importsMap by a constructed key.
  for (const [key, value] of Object.entries(importsMap)) {
    const target =
      typeof value === 'string'
        ? value
        : (value.source ?? value.import ?? value.require ?? value.default);

    if (!target) {
      continue;
    }

    if (key === specifier) {
      return importPathContract.parse(target);
    }

    if (wildcardMatch) {
      continue;
    }

    const starIndex = key.indexOf('*');
    if (starIndex === -1) {
      continue;
    }

    const prefix = key.slice(0, starIndex);
    const suffix = key.slice(starIndex + 1);
    const longEnough = specifier.length >= prefix.length + suffix.length;

    if (longEnough && specifier.startsWith(prefix) && specifier.endsWith(suffix)) {
      const captured = specifier.slice(prefix.length, specifier.length - suffix.length);
      wildcardMatch = importPathContract.parse(target.replace('*', captured));
    }
  }

  return wildcardMatch;
};
