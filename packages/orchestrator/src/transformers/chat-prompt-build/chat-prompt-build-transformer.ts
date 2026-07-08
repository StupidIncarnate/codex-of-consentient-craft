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
import { dumpsterCreatePromptStatics } from '../../statics/dumpster-create-prompt/dumpster-create-prompt-statics';
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

  const statics = role === 'chaoswhisperer' ? dumpsterCreatePromptStatics : glyphsmithPromptStatics;

  let promptText = statics.prompt.template.replace(statics.prompt.placeholders.arguments, message);

  if (role === 'chaoswhisperer') {
    // Splice the quest-bootstrap block BEFORE filling $QUEST_ID — the preCreated variant embeds
    // $QUEST_ID tokens the substitution below must reach. A questId means the server already minted
    // this quest (headless node-mode spawn), so ChaosWhisperer adopts it instead of creating a
    // duplicate; no questId is the mint path (only reached if a caller spawns without pre-creating).
    const bootstrap = questId
      ? dumpsterCreatePromptStatics.questBootstrap.preCreated
      : dumpsterCreatePromptStatics.questBootstrap.mint;
    promptText = promptText.replace(
      dumpsterCreatePromptStatics.prompt.placeholders.questBootstrap,
      bootstrap,
    );
  }

  if (questId) {
    // split/join replaces EVERY $QUEST_ID occurrence — the preCreated bootstrap references it more
    // than once, and String.replace(string, string) would swap only the first.
    promptText = promptText.split(statics.prompt.placeholders.questId).join(questId);
  }

  if (role === 'chaoswhisperer') {
    // This is the headless spawn path (node orchestrationMode): ChaosWhisperer runs without an
    // interactive TTY, so it must use the MCP ask-user-question tool (native AskUserQuestion is
    // unavailable). The /dumpster-create slash-command build substitutes the native variant instead.
    promptText = promptText.replace(
      dumpsterCreatePromptStatics.prompt.placeholders.clarifyInstruction,
      dumpsterCreatePromptStatics.clarifyInstructions.mcp,
    );
  }

  return promptTextContract.parse(promptText);
};
