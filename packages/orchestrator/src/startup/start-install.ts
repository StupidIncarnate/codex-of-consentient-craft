/**
 * PURPOSE: Install orchestrator package by generating slash command and agent files
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates .claude/commands/ with quest.md and quest:start.md, and .claude/agents/ with agent files
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
import { finalizerQuestAgentPromptStatics } from '../statics/finalizer-quest-agent-prompt/finalizer-quest-agent-prompt-statics';
import { pathseekerPromptStatics } from '../statics/pathseeker-prompt/pathseeker-prompt-statics';
import { gapReviewerAgentPromptStatics } from '../statics/gap-reviewer-agent-prompt/gap-reviewer-agent-prompt-statics';

const CLAUDE_DIR = '.claude';
const COMMANDS_DIR = 'commands';
const AGENTS_DIR = 'agents';
const PACKAGE_NAME = '@dungeonmaster/orchestrator';
const QUEST_FILENAME = 'quest.md';
const QUEST_START_FILENAME = 'quest:start.md';
const QUEST_FINALIZER_FILENAME = 'finalizer-quest-agent.md';
const QUEST_PATH_SEEKER_FILENAME = 'quest-path-seeker.md';
const QUEST_GAP_REVIEWER_FILENAME = 'quest-gap-reviewer.md';

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

  const agentsDir = pathJoinAdapter({
    paths: [context.targetProjectRoot, CLAUDE_DIR, AGENTS_DIR],
  });

  await fsMkdirAdapter({ filepath: agentsDir });

  const questFinalizerFilePath = pathJoinAdapter({
    paths: [agentsDir, QUEST_FINALIZER_FILENAME],
  });

  const questPathSeekerFilePath = pathJoinAdapter({
    paths: [commandsDir, QUEST_PATH_SEEKER_FILENAME],
  });

  const questGapReviewerFilePath = pathJoinAdapter({
    paths: [agentsDir, QUEST_GAP_REVIEWER_FILENAME],
  });

  const questFinalizerContent = fileContentsContract.parse(
    finalizerQuestAgentPromptStatics.prompt.template,
  );

  const questPathSeekerContent = fileContentsContract.parse(
    pathseekerPromptStatics.prompt.template,
  );

  const questGapReviewerContent = fileContentsContract.parse(
    gapReviewerAgentPromptStatics.prompt.template,
  );

  await fsWriteFileAdapter({ filePath: questFinalizerFilePath, contents: questFinalizerContent });
  await fsWriteFileAdapter({ filePath: questPathSeekerFilePath, contents: questPathSeekerContent });
  await fsWriteFileAdapter({
    filePath: questGapReviewerFilePath,
    contents: questGapReviewerContent,
  });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      'Created .claude/commands/ with quest.md, quest:start.md, and quest-path-seeker.md, .claude/agents/ with finalizer-quest-agent.md and quest-gap-reviewer.md',
    ),
  };
};
