/**
 * PURPOSE: Install orchestrator package by generating slash command files in .claude/commands/
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates .claude/commands/ directory and writes quest.md and quest:start.md
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import { fsWriteFileAdapter } from '../adapters/fs/write-file/fs-write-file-adapter';
import { chaoswhispererPromptStatics } from '../statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';
import { questStartPromptStatics } from '../statics/quest-start-prompt/quest-start-prompt-statics';

const CLAUDE_DIR = '.claude';
const COMMANDS_DIR = 'commands';
const PACKAGE_NAME = '@dungeonmaster/orchestrator';
const QUEST_FILENAME = 'quest.md';
const QUEST_START_FILENAME = 'quest:start.md';

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const commandsDir = pathJoinAdapter({
    paths: [context.targetProjectRoot, CLAUDE_DIR, COMMANDS_DIR],
  });

  await fsMkdirAdapter({ filepath: commandsDir });

  const questFilePath = pathJoinAdapter({
    paths: [commandsDir, QUEST_FILENAME],
  });

  const questStartFilePath = pathJoinAdapter({
    paths: [commandsDir, QUEST_START_FILENAME],
  });

  const questContent = fileContentsContract.parse(chaoswhispererPromptStatics.prompt.template);
  const questStartContent = fileContentsContract.parse(questStartPromptStatics.prompt.template);

  await fsWriteFileAdapter({ filePath: questFilePath, contents: questContent });
  await fsWriteFileAdapter({ filePath: questStartFilePath, contents: questStartContent });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      'Created .claude/commands/ with quest.md and quest:start.md',
    ),
  };
};
