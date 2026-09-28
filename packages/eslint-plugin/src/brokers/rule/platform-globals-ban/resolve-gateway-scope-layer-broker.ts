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
import {
  filePathContract,
  packageJsonContract,
  type PackageName,
} from '@dungeonmaster/shared/contracts';
import { packageScopeFromNameTransformer } from '@dungeonmaster/shared/transformers';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { readFileSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';
import { findAncestorDirectoryLayerBroker } from './find-ancestor-directory-layer-broker';

// A wrapper object, not a bare `let cachedScope: PackageName | undefined`: `no-undef-init`
// autofixes an explicit `= undefined` initializer away, which then trips
// `@typescript-eslint/init-declarations` right back — the two rules fight over a bare optional
// `let`. A `const` object with an optional field satisfies both.
const scopeCache: { value?: PackageName } = {};

export const resolveGatewayScopeLayerBroker = ({
  filename,
}: {
  filename: string;
}): PackageName | undefined => {
  if (scopeCache.value !== undefined) {
    return scopeCache.value;
  }

  const startDir = filePathContract.parse(dirname(filename));
  const repoRoot = findAncestorDirectoryLayerBroker({
    startDir,
    markerFileName: locationsStatics.repoRoot.config,
  });

  if (repoRoot === undefined) {
    return undefined;
  }

  const packageJsonRaw = readFileSync(join(repoRoot, 'package.json'));
  const packageJson = packageJsonContract.parse(JSON.parse(packageJsonRaw));
  const rootPackageName = packageJson.name ?? 'dungeonmaster';

  scopeCache.value = packageScopeFromNameTransformer({ rootPackageName });
  return scopeCache.value;
};
