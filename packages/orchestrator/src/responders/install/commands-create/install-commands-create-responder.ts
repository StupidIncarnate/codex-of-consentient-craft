/**
 * PURPOSE: Writes the `/dumpster-create` and `/dumpster-launch` slash command markdown files into
 * `<targetProjectRoot>/.claude/commands/`. Creates the directory if missing; overwrites existing
 * files (idempotent). Drives the user-facing entry points for the Dumpster orchestration loop.
 *
 * USAGE:
 * const result = await InstallCommandsCreateResponder({ context });
 * // Returns InstallResult — action 'created'; the two command files are written to disk
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
    pathJoinAdapter({
      paths: [context.targetProjectRoot, locationsStatics.repoRoot.claude.dir, COMMANDS_DIR_NAME],
    }),
  );

  await fsMkdirAdapter({ filepath: commandsDir });

  const createPath = filePathContract.parse(
    pathJoinAdapter({ paths: [commandsDir, slashCommandsStatics.dumpsterCreate.fileName] }),
  );
  const launchPath = filePathContract.parse(
    pathJoinAdapter({ paths: [commandsDir, slashCommandsStatics.dumpsterLaunch.fileName] }),
  );

  await fsWriteFileAdapter({
    filePath: createPath,
    contents: fileContentsContract.parse(slashCommandsStatics.dumpsterCreate.body),
  });
  await fsWriteFileAdapter({
    filePath: launchPath,
    contents: fileContentsContract.parse(slashCommandsStatics.dumpsterLaunch.body),
  });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      'Created .claude/commands/dumpster-create.md and .claude/commands/dumpster-launch.md',
    ),
  };
};
