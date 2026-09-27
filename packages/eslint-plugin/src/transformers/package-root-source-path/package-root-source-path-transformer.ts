/**
 * PURPOSE: Builds the absolute path to a file inside a workspace package's own `src/`, anchored on
 * the linted caller's own absolute path at its nearest `/packages/` segment — the npm-workspaces
 * layout every consumer repo has (`packages/<name>/src/...`). Returns null when the caller path
 * carries no `/packages/` segment (a synthetic RuleTester fixture outside the real repo layout), so
 * enforce-proxy-child-creation falls back to its own conservative default instead of reading a path
 * that cannot exist. Two callers share it: reading a package's root barrel (`relativePath:
 * 'index.ts'`) to find which file a bare `@scope/pkg` import's name re-exports from, and checking
 * whether THAT file's own `.proxy.ts` exists on disk — never a hardcoded folder type, since which
 * folder a package's public export lives under varies per package (an orchestrator-style composed
 * startup object sits under `startup/`; a broker re-exported for a sibling package sits under
 * `brokers/`).
 *
 * USAGE:
 * packageRootSourcePathTransformer({
 *   callerFilePath: filePathContract.parse('/repo/packages/mcp/src/adapters/x/x.proxy.ts'),
 *   packageName: 'orchestrator',
 *   relativePath: 'index.ts',
 * });
 * // Returns '/repo/packages/orchestrator/src/index.ts' as branded FilePath
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

const PACKAGES_SEGMENT = '/packages/';

export const packageRootSourcePathTransformer = ({
  callerFilePath,
  packageName,
  relativePath,
}: {
  callerFilePath: FilePath;
  packageName: string;
  relativePath: string;
}): FilePath | null => {
  const packagesIndex = callerFilePath.indexOf(PACKAGES_SEGMENT);
  if (packagesIndex === -1) {
    return null;
  }

  const workspaceRoot = callerFilePath.slice(0, packagesIndex);
  return filePathContract.parse(`${workspaceRoot}/packages/${packageName}/src/${relativePath}`);
};
