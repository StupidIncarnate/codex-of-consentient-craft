/**
 * PURPOSE: Reads the repo's own `@scope` from its root package.json, the same way
 * packageScopeFromNameTransformer expects, so an unscoped root ('dungeonmaster') becomes '@dungeonmaster'
 * and a published consumer whose root package is named something else gets ITS OWN scope with no
 * code change. Finds the root by walking up to locationsStatics.repoRoot.config
 * ('.dungeonmaster.json'), the same marker cwdResolveBroker's 'repo-root' kind walks to elsewhere in
 * this codebase. Cached at module scope: the scope is one value for the whole lint run, never one
 * value per file.
 *
 * USAGE:
 * resolveGatewayScopeLayerBroker({ filename: '/repo/packages/@gateway/node/src/fs/fs.ts' });
 * // Returns '@dungeonmaster' as PackageName
 */
import { packageJsonContract } from '@dungeonmaster/shared/contracts';
import { packageScopeFromNameTransformer } from '@dungeonmaster/shared/transformers';
import { locationsStatics, gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { existsSync, readFileSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';
import { findAncestorDirectoryLayerBroker } from './find-ancestor-directory-layer-broker';
import { gatewayConsumerPackageJsonContract } from '../../../contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract';

// A wrapper object, not a bare `let cachedScope: PackageName | undefined`: `no-undef-init`
// autofixes an explicit `= undefined` initializer away, which then trips
// `@typescript-eslint/init-declarations` right back — the two rules fight over a bare optional
// `let`. A `const` object with an optional field satisfies both.
const scopeCache: { value?: string } = {};

export const resolveGatewayScopeLayerBroker = ({
  filename,
}: {
  filename: string;
}): string | undefined => {
  if (scopeCache.value !== undefined) {
    return scopeCache.value;
  }

  const startDir = dirname(filename);
  const repoRoot = findAncestorDirectoryLayerBroker({
    startDir,
    markerFileName: locationsStatics.repoRoot.config,
  });

  if (repoRoot === undefined) {
    return undefined;
  }

  for (const folder of Object.values(gatewayLocationsStatics.folders)) {
    const gatewayPackageJsonPath = join(repoRoot, 'packages', '@gateway', folder, 'package.json');
    if (existsSync(gatewayPackageJsonPath)) {
      try {
        const gatewayPackageJsonRaw = readFileSync(gatewayPackageJsonPath);
        const parsed = gatewayConsumerPackageJsonContract.safeParse(
          JSON.parse(gatewayPackageJsonRaw),
        );
        if (parsed.success && parsed.data.name.startsWith('@')) {
          scopeCache.value = packageScopeFromNameTransformer({ rootPackageName: parsed.data.name });
          return scopeCache.value;
        }
      } catch {
        // Fall through
      }
    }
  }

  const packageJsonRaw = readFileSync(join(repoRoot, 'package.json'));
  const packageJson = packageJsonContract.parse(JSON.parse(packageJsonRaw));
  const rootPackageName = packageJson.name ?? 'dungeonmaster';

  scopeCache.value = packageScopeFromNameTransformer({ rootPackageName });
  return scopeCache.value;
};
