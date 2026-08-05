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
import { dumpsterHuntPromptStatics } from '../../statics/dumpster-hunt-prompt/dumpster-hunt-prompt-statics';
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

  // The two spec-intake roles share a prompt shape: a $QUEST_BOOTSTRAP block selected by whether
  // the quest was pre-created, and a $CLARIFY_INSTRUCTION block selected by execution context.
  // Glyphsmith has neither, so it is the null arm — its template is filled by $ARGUMENTS alone.
  const intakeStatics =
    role === 'chaoswhisperer'
      ? dumpsterCreatePromptStatics
      : role === 'bughunt'
        ? dumpsterHuntPromptStatics
        : null;

  const statics = intakeStatics ?? glyphsmithPromptStatics;

  // Function replacement, not a string one: `message` is the user's raw text and can contain a `$`
  // sequence (`$&`, `` $` ``, `$'`) that a string replacement expands against the match — `` $` ``
  // splices the whole preceding template in. A function replacement is taken verbatim.
  let promptText = statics.prompt.template.replace(
    statics.prompt.placeholders.arguments,
    () => message,
  );

  if (intakeStatics !== null) {
    // Splice the quest-bootstrap block BEFORE filling $QUEST_ID — the preCreated variant embeds
    // $QUEST_ID tokens the substitution below must reach. A questId means the server already minted
    // this quest (headless node-mode spawn), so the intake agent adopts it instead of creating a
    // duplicate; no questId is the mint path (only reached if a caller spawns without pre-creating).
    const bootstrap = questId
      ? intakeStatics.questBootstrap.preCreated
      : intakeStatics.questBootstrap.mint;
    promptText = promptText.replace(
      intakeStatics.prompt.placeholders.questBootstrap,
      () => bootstrap,
    );
  }

  if (questId) {
    // split/join replaces EVERY $QUEST_ID occurrence — the preCreated bootstrap references it more
    // than once, and String.replace(string, string) would swap only the first.
    promptText = promptText.split(statics.prompt.placeholders.questId).join(questId);
  }

  if (intakeStatics !== null) {
    // This is the headless spawn path (node orchestrationMode): the intake agent runs without an
    // interactive TTY, so it must use the MCP ask-user-question tool (native AskUserQuestion is
    // unavailable). The slash-command build substitutes the native variant instead.
    promptText = promptText.replace(
      intakeStatics.prompt.placeholders.clarifyInstruction,
      () => intakeStatics.clarifyInstructions.mcp,
    );
  }

  return promptTextContract.parse(promptText);
};
