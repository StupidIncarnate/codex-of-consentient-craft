/**
 * PURPOSE: Scaffolds the repo-root state dungeonmaster needs in a target repo — the `worktrees/`
 * directory every quest carve checks out into, plus the `.gitignore` lines that keep that directory
 * and the `.quest-plans/` one the operator roles write their plan files into out of a quest's
 * commits. Reach for this over install-write-gitignore-responder (ward's own): that one only
 * appends lines and matches them by substring; this one also CREATES a directory, and matches a
 * whole line so a pattern carrying leading whitespace cannot be read as a hit. Every entry is
 * decided on its own, so a repo holding one of them and not the other converges to both on a re-run.
 *
 * USAGE:
 * const result = await InstallRepoScaffoldResponder({ context });
 * // Creates worktrees/ if absent and appends whichever ignore lines are still missing
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
const QUEST_PLANS_DIRNAME = '.quest-plans';
const WORKTREES_ENTRY = `${locationsStatics.repoRoot.worktreesDir}/`;

// Both names are IGNORED; only `worktrees/` is created. An operator role's own `Write` is what
// brings `.quest-plans/` into being, so creating it here would leave an empty directory in every
// repo `dungeonmaster init` touches.
const IGNORED_DIR_NAMES = [locationsStatics.repoRoot.worktreesDir, QUEST_PLANS_DIRNAME];

export const InstallRepoScaffoldResponder = async ({
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

  // trimEnd, never trim: git strips TRAILING pattern whitespace but treats LEADING whitespace as
  // part of the pattern, so `   worktrees/` ignores a directory literally named `   worktrees` and
  // leaves the real one unignored. Stripping both ends would call that line a match, skip the
  // append, and report success on a repo whose worktrees/ git still tracks. trimEnd also drops the
  // \r of a CRLF file, which git honours.
  const ignoredLines = existingContent.split('\n').map((line) => line.trimEnd());

  // A bare name and a trailing-slash name both ignore the directory, so either one is a match.
  const missingDirNames = IGNORED_DIR_NAMES.filter(
    (dirName) => !ignoredLines.includes(dirName) && !ignoredLines.includes(`${dirName}/`),
  );
  const missingEntries = missingDirNames.map((dirName) => `${dirName}/`);
  const presentEntries = IGNORED_DIR_NAMES.filter(
    (dirName) => !missingDirNames.includes(dirName),
  ).map((dirName) => `${dirName}/`);

  if (missingEntries.length > 0) {
    const appended = `${missingEntries.join('\n')}\n`;
    const newContent = existingContent ? `${existingContent.trimEnd()}\n${appended}` : appended;
    await fsWriteFileAdapter({
      filePath: gitignorePath,
      contents: fileContentsContract.parse(newContent),
    });
  }

  let dirClause = `Created ${WORKTREES_ENTRY}`;
  if (dirPresent) {
    dirClause = `${WORKTREES_ENTRY} already present`;
  }

  const clauses = [dirClause];
  if (missingEntries.length > 0) {
    clauses.push(
      gitignorePresent
        ? `Added ${missingEntries.join(', ')} to existing ${GITIGNORE_FILENAME}`
        : `Created ${GITIGNORE_FILENAME} with ${missingEntries.join(', ')}`,
    );
  }
  if (presentEntries.length > 0) {
    clauses.push(`${presentEntries.join(', ')} already in ${GITIGNORE_FILENAME}`);
  }

  const action = dirPresent && missingEntries.length === 0 ? 'skipped' : 'created';

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action,
    message: installMessageContract.parse(clauses.join('; ')),
  };
};
