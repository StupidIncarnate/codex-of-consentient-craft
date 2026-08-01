/**
 * PURPOSE: Validates an `ask-user-question` MCP tool call and returns a routing instruction. The tool
 * is fire-and-forget: the questions are surfaced to the user's browser clarify panel by the web (which
 * scans the session stream for this exact tool call), and the user's answers arrive as the agent's
 * next user message when the session resumes. Used by headless ChaosWhisperer (node orchestrationMode)
 * where the native AskUserQuestion tool is unavailable (no interactive TTY).
 *
 * The reply has to serve TWO caller shapes, and telling both to wait strands one of them: an
 * interactive chat session (ChaosWhisperer / Glyphsmith) IS resumed with the user's answer and must
 * stop, whereas a dispatched relay agent (Siegemaster, Flowrider) never receives another user turn —
 * if it waits it ends its turn without `signal-back`, leaving its work item `in_progress` forever and
 * wedging every role behind it. So the instruction names the condition instead of assuming the
 * interactive case.
 *
 * USAGE:
 * const text = askUserQuestionBroker({ input });
 * // Returns ContentText — "questions sent", plus wait-or-continue keyed on the caller's shape
 */

import { askUserQuestionContract } from '@dungeonmaster/shared/contracts';

import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const askUserQuestionBroker = ({ input }: { input: unknown }): ContentText => {
  askUserQuestionContract.parse(input);

  return contentTextContract.parse(
    [
      'Questions sent to the user.',
      "If you are an INTERACTIVE session (you were started by a slash command or a chat, and you have no work item): their answers arrive as your next user message. Do NOT continue generating — stop here and wait for the session to resume with the user's response.",
      'If you are a DISPATCHED WORK-ITEM agent (you fetched your prompt with get-agent-prompt and a workItemId): nothing will resume you, so do NOT wait. Record the question and the fact that it is outstanding in your handoff, keep working through the rest of your prompt, and finish your turn with signal-back as normal.',
    ].join(' '),
  );
};
