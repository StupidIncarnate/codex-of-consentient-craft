/**
 * PURPOSE: Walks up from a starting directory to the nearest ancestor `package.json` that carries
 * a `workspaces` field — the npm-workspaces ROOT, per this repo's own "every consumer repo is an
 * npm-workspaces monorepo" constraint — and derives the `@scope` raw-import-ban, gateway-import-boundary
 * and bin-program-spawn-ban all build their gateway-path checks from. One ordinary broker, not a
 * layer file, precisely so the three rules import ONE copy instead of each keeping its own — the
 * same fix F4 made for `workspaceRootFindBroker`. Walking from a real directory (rather than reading
 * `process.cwd()`, which `@dungeonmaster/no-bare-process-cwd` reserves for CLI entry points and
 * path-resolver brokers) means the same walk finds THIS repo's root when a rule runs from source,
 * and a consumer's own root once this package is installed under their `node_modules`. Directories
 * are joined with a plain "/" rather than `join`: every path here is already
 * POSIX-absolute (`__dirname` at rule-module load, or a value this same function derived), so no
 * cross-platform behaviour is needed, and skipping it keeps this broker's only child proxy
 * the fs one its own test actually stages. Derives the scope via `packageScopeFromNameTransformer`
 * directly, not the tolerant `workspaceScopeFromRootNameTransformer` (F4, in `shared`):
 * `workspaceRootPackageJsonContract` already guarantees `name` is a non-empty string once a
 * package.json parses as the workspaces root, so there is nothing missing for a fallback to stand in
 * for, and every caller here needs the `PackageName` brand the direct transformer returns, not
 * `workspaceScopeFromRootNameTransformer`'s `PathSegment`.
 *
 * USAGE:
 * repoScopeResolveBroker({ startDir: filePathContract.parse(__dirname) });
 * // Returns '@dungeonmaster' as branded PackageName, read from the repo root package.json's name
 */
import { packageScopeFromNameTransformer } from '@dungeonmaster/shared/transformers';
import { existsSync, readFileSync } from '#gateway/node/fs';
import { workspaceRootPackageJsonContract } from '../../../contracts/workspace-root-package-json/workspace-root-package-json-contract';

export const repoScopeResolveBroker = ({ startDir }: { startDir: string }): string => {
  const packageJsonPath = `${startDir}/package.json`;

  if (existsSync(packageJsonPath)) {
    const contents = readFileSync(packageJsonPath);
    const workspaceRoot = workspaceRootPackageJsonContract.safeParse(JSON.parse(contents));

    if (workspaceRoot.success) {
      return packageScopeFromNameTransformer({ rootPackageName: workspaceRoot.data.name });
    }
  }

  const lastSlashIndex = startDir.lastIndexOf('/');
  const parentDir = lastSlashIndex <= 0 ? '/' : startDir.slice(0, lastSlashIndex);

  if (parentDir === startDir) {
    throw new Error(
      `repoScopeResolveBroker could not find a workspaces root package.json walking up from "${startDir}".`,
    );
  }

  return repoScopeResolveBroker({ startDir: parentDir });
};
