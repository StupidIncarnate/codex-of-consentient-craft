/**
 * PURPOSE: Reads the npm-workspaces ROOT's own `workspaces` glob patterns ONCE, at eslint.config.js
 * load time — never inside a rule at lint time — and resolves each glob to the real member package
 * names, so `ban-workspace-export-mocks` gets its whole workspace-package list as a rule OPTION and
 * itself reads no file, keeping it `'pre-edit'` eligible. Reuses `workspaceRootFindBroker`'s walk to
 * locate the root rather than re-walking, then re-reads that root's own package.json for the
 * `workspaces` field the walk does not return. Never hard-codes this repo's own `@dungeonmaster/`
 * scope: every name comes from a member's own manifest, so a consumer repo scoped differently
 * resolves the same way.
 *
 * USAGE:
 * configWorkspacePackageNamesBroker({ startDir: filePathContract.parse(__dirname) });
 * // Returns ['@dungeonmaster/orchestrator', '@dungeonmaster/server', ...] — every packages/* and
 * // packages/@gateway/* member's own package.json name field
 */
import type { PackageName } from '@dungeonmaster/shared/contracts';
import { readFileSync } from '#gateway/node/fs';
import { workspaceRootFindBroker } from '../../workspace-root/find/workspace-root-find-broker';
import { workspaceRootPackageJsonContract } from '../../../contracts/workspace-root-package-json/workspace-root-package-json-contract';
import { resolveWorkspaceGlobLayerBroker } from './resolve-workspace-glob-layer-broker';

export const configWorkspacePackageNamesBroker = ({
  startDir,
}: {
  startDir: string;
}): PackageName[] => {
  const workspaceRoot = workspaceRootFindBroker({ startDir });

  if (workspaceRoot === undefined) {
    return [];
  }

  const rootPackageJsonPath = `${workspaceRoot.rootDir}/package.json`;
  const contents = readFileSync(rootPackageJsonPath);
  const rootPackageJson = workspaceRootPackageJsonContract.parse(JSON.parse(contents));

  const globs = Array.isArray(rootPackageJson.workspaces)
    ? rootPackageJson.workspaces
    : Object.keys(rootPackageJson.workspaces);

  const names = globs.flatMap((glob) =>
    resolveWorkspaceGlobLayerBroker({ rootDir: workspaceRoot.rootDir, glob }),
  );

  return Array.from(new Set(names));
};
