/**
 * PURPOSE: Writes .claude/agents/ prompt files from statics to a target project path just-in-time before agent spawn
 *
 * USAGE:
 * await agentFilesEnsureBroker({ targetPath: absoluteFilePathContract.parse('/path/to/guild') });
 * // Ensures .claude/agents/quest-gap-reviewer.md and finalizer-quest-agent.md exist at targetPath
 */

import { fileContentsContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { gapReviewerAgentPromptStatics } from '../../../statics/gap-reviewer-agent-prompt/gap-reviewer-agent-prompt-statics';
import { finalizerQuestAgentPromptStatics } from '../../../statics/finalizer-quest-agent-prompt/finalizer-quest-agent-prompt-statics';

const CLAUDE_DIR = '.claude';
const AGENTS_DIR = 'agents';
const GAP_REVIEWER_FILENAME = 'quest-gap-reviewer.md';
const FINALIZER_FILENAME = 'finalizer-quest-agent.md';

export const agentFilesEnsureBroker = async ({
  targetPath,
}: {
  targetPath: AbsoluteFilePath;
}): Promise<void> => {
  const agentsDir = pathJoinAdapter({
    paths: [targetPath, CLAUDE_DIR, AGENTS_DIR],
  });

  await fsMkdirAdapter({ filepath: agentsDir });

  const gapReviewerPath = pathJoinAdapter({
    paths: [agentsDir, GAP_REVIEWER_FILENAME],
  });

  const finalizerPath = pathJoinAdapter({
    paths: [agentsDir, FINALIZER_FILENAME],
  });

  const gapReviewerContent = fileContentsContract.parse(
    gapReviewerAgentPromptStatics.prompt.template,
  );

  const finalizerContent = fileContentsContract.parse(
    finalizerQuestAgentPromptStatics.prompt.template,
  );

  await fsWriteFileAdapter({ filePath: gapReviewerPath, contents: gapReviewerContent });
  await fsWriteFileAdapter({ filePath: finalizerPath, contents: finalizerContent });
};
