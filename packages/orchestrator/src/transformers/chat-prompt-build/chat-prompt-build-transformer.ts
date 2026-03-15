/**
 * PURPOSE: Builds the prompt text for a chat spawn based on role, message, questId, and optional sessionId
 *
 * USAGE:
 * chatPromptBuildTransformer({ role: 'chaoswhisperer', message: 'Help me', questId: QuestIdStub() });
 * // Returns branded PromptText with role-specific template populated
 */

import type { QuestId, SessionId, WorkItemRole } from '@dungeonmaster/shared/contracts';

import { promptTextContract } from '../../contracts/prompt-text/prompt-text-contract';
import type { PromptText } from '../../contracts/prompt-text/prompt-text-contract';
import { chaoswhispererPromptStatics } from '../../statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';
import { glyphsmithPromptStatics } from '../../statics/glyphsmith-prompt/glyphsmith-prompt-statics';

export const chatPromptBuildTransformer = ({
  role,
  message,
  questId,
  sessionId,
}: {
  role: WorkItemRole;
  message: string;
  questId: QuestId | null;
  sessionId?: SessionId;
}): PromptText => {
  if (sessionId) {
    return promptTextContract.parse(message);
  }

  const statics = role === 'chaoswhisperer' ? chaoswhispererPromptStatics : glyphsmithPromptStatics;

  let promptText = statics.prompt.template.replace(statics.prompt.placeholders.arguments, message);

  if (questId) {
    promptText = promptText.replace(statics.prompt.placeholders.questId, questId);
  }

  return promptTextContract.parse(promptText);
};
