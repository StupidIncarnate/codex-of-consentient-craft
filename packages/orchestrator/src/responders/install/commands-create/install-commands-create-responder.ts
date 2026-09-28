/**
 * PURPOSE: Writes the `/dumpster-create` and `/dumpster-hunt` slash command markdown files into
 * `<targetProjectRoot>/.claude/commands/`. Creates the directory if missing; overwrites existing
 * files (idempotent). Drives the user-facing intake entry points (feature spec intake and bug-hunt
 * intake); dispatch runs from the web UI's /queue page.
 *
 * USAGE:
 * const result = await InstallCommandsCreateResponder({ context });
 * // Returns InstallResult — action 'created'; the two command files are written to disk
 */

import {
  type InstallContext,
  type InstallResult,
  fileContentsContract,
  filePathContract,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { ensureDir } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { slashCommandsStatics } from '../../../statics/slash-commands/slash-commands-statics';

const PACKAGE_NAME = '@dungeonmaster/orchestrator';
const COMMANDS_DIR_NAME = 'commands';

export const InstallCommandsCreateResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const commandsDir = filePathContract.parse(
    join(context.targetProjectRoot, locationsStatics.repoRoot.claude.dir, COMMANDS_DIR_NAME),
  );

  await ensureDir(commandsDir);

  const createPath = filePathContract.parse(
    join(commandsDir, slashCommandsStatics.dumpsterCreate.fileName),
  );
  const huntPath = filePathContract.parse(
    join(commandsDir, slashCommandsStatics.dumpsterHunt.fileName),
  );

  await fsWriteFileAdapter({
    filePath: createPath,
    contents: fileContentsContract.parse(slashCommandsStatics.dumpsterCreate.body),
  });
  await fsWriteFileAdapter({
    filePath: huntPath,
    contents: fileContentsContract.parse(slashCommandsStatics.dumpsterHunt.body),
  });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      'Created .claude/commands/dumpster-create.md and .claude/commands/dumpster-hunt.md',
    ),
  };
};
