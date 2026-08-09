/**
 * PURPOSE: Guarantees `worktrees/` exists and is git-ignored at the target repo root — the two
 * preconditions every later git-worktree quest checkout depends on. Reach for this over
 * install-write-gitignore-responder (the ward sibling): that one owns a single self-contained
 * entry for ward's own package; this one owns BOTH a directory AND its gitignore line, checked
 * independently so a partially-scaffolded repo (dir present, entry missing, or vice versa) still
 * converges to the full state on a re-run.
 *
 * USAGE:
 * const result = await InstallWorktreesScaffoldResponder({ context });
 * // Creates worktrees/ and/or appends its gitignore entry, whichever is still missing
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  type InstallContext,
  type InstallResult,
  fileContentsContract,
  filePathContract,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

const PACKAGE_NAME = '@dungeonmaster/orchestrator';
const GITIGNORE_FILENAME = '.gitignore';
const WORKTREES_ENTRY = `${locationsStatics.repoRoot.worktreesDir}/`;

export const InstallWorktreesScaffoldResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const worktreesDir = filePathContract.parse(
    pathJoinAdapter({
      paths: [context.targetProjectRoot, locationsStatics.repoRoot.worktreesDir],
    }),
  );
  const gitignorePath = filePathContract.parse(
    pathJoinAdapter({ paths: [context.targetProjectRoot, GITIGNORE_FILENAME] }),
  );

  const dirPresent = await fsIsAccessibleAdapter({ filePath: worktreesDir });
  if (!dirPresent) {
    await fsMkdirAdapter({ filepath: worktreesDir });
  }

  const gitignorePresent = await fsIsAccessibleAdapter({ filePath: gitignorePath });
  const existingContent = gitignorePresent
    ? String(await fsReadFileAdapter({ filePath: gitignorePath }))
    : '';

  const alreadyIgnored = existingContent.split('\n').some((line) => {
    const trimmed = line.trim();
    return trimmed === WORKTREES_ENTRY || trimmed === locationsStatics.repoRoot.worktreesDir;
  });

  if (!alreadyIgnored) {
    const newContent = existingContent
      ? `${existingContent.trimEnd()}\n${WORKTREES_ENTRY}\n`
      : `${WORKTREES_ENTRY}\n`;
    await fsWriteFileAdapter({
      filePath: gitignorePath,
      contents: fileContentsContract.parse(newContent),
    });
  }

  let dirClause = `Created ${WORKTREES_ENTRY}`;
  if (dirPresent) {
    dirClause = `${WORKTREES_ENTRY} already present`;
  }

  let ignoreClause = `Created ${GITIGNORE_FILENAME} with ${WORKTREES_ENTRY}`;
  if (alreadyIgnored) {
    ignoreClause = `${WORKTREES_ENTRY} already in ${GITIGNORE_FILENAME}`;
  } else if (gitignorePresent) {
    ignoreClause = `Added ${WORKTREES_ENTRY} to existing ${GITIGNORE_FILENAME}`;
  }

  const action = dirPresent && alreadyIgnored ? 'skipped' : 'created';

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action,
    message: installMessageContract.parse(`${dirClause}; ${ignoreClause}`),
  };
};
