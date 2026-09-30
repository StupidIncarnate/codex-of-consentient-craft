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
  installResultContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { slashCommandsStatics } from '../../../statics/slash-commands/slash-commands-statics';

const PACKAGE_NAME = '@dungeonmaster/orchestrator';
const COMMANDS_DIR_NAME = 'commands';

export const InstallCommandsCreateResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const commandsDir = join(
    context.targetProjectRoot,
    locationsStatics.repoRoot.claude.dir,
    COMMANDS_DIR_NAME,
  );

  await ensureDir(commandsDir);

  const createPath = join(commandsDir, slashCommandsStatics.dumpsterCreate.fileName);
  const huntPath = join(commandsDir, slashCommandsStatics.dumpsterHunt.fileName);

  await writeFile(createPath, slashCommandsStatics.dumpsterCreate.body);
  await writeFile(huntPath, slashCommandsStatics.dumpsterHunt.body);

  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success: true,
    action: 'created',
    message: 'Created .claude/commands/dumpster-create.md and .claude/commands/dumpster-hunt.md',
  });
};
