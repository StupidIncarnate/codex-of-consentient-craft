/**
 * PURPOSE: Handles refs:sync and refs:check subcommands by invoking the project-references sync broker
 *
 * USAGE:
 * await WardRefsResponder({ args: ['node', 'ward', 'refs:sync'], rootPath: AbsoluteFilePathStub(), mode: 'sync' });
 * // mode 'sync' writes drift, mode 'check' errors on drift (exit 1) and writes nothing
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { workspaceDiscoverBroker } from '../../../brokers/workspace/discover/workspace-discover-broker';
import { projectReferencesSyncBroker } from '../../../brokers/project-references/sync/project-references-sync-broker';

export const WardRefsResponder = async ({
  rootPath,
  mode,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
  mode: 'sync' | 'check';
}): Promise<AdapterResult> => {
  const workspaces = await workspaceDiscoverBroker({ rootPath });

  if (workspaces === null || workspaces.length === 0) {
    process.stderr.write('refs: no workspaces found in root package.json — nothing to do.\n');
    return adapterResultContract.parse({ success: true });
  }

  const result = await projectReferencesSyncBroker({
    rootPath,
    projectFolders: workspaces,
    checkOnly: mode === 'check',
  });

  if (result.status === 'cycle') {
    const cycleStr = result.cycle?.join(' -> ') ?? '';
    process.stderr.write(`refs: cycle detected in dependency graph: ${cycleStr}\n`);
    process.exitCode = 1;
    return adapterResultContract.parse({ success: true });
  }

  if (result.status === 'drift') {
    const driftStr = (result.driftPaths ?? []).map((p) => String(p)).join('\n  ');
    process.stderr.write(
      `refs: project references out of sync with package.json — run "npm run ward" locally to regenerate:\n  ${driftStr}\n`,
    );
    process.exitCode = 1;
    return adapterResultContract.parse({ success: true });
  }

  if (result.status === 'synced') {
    process.stdout.write(
      `refs: synced project references in ${String(result.writtenPaths.length)} tsconfig(s)\n`,
    );
    for (const path of result.writtenPaths) {
      process.stdout.write(`  ${String(path)}\n`);
    }
    return adapterResultContract.parse({ success: true });
  }

  process.stdout.write(
    `refs: project references in sync (${String(result.eligibleCount)} eligible packages)\n`,
  );
  return adapterResultContract.parse({ success: true });
};
