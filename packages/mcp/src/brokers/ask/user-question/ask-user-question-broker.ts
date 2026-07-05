/**
 * PURPOSE: Validates an `ask-user-question` MCP tool call and returns a wait instruction. The tool is
 * fire-and-forget: the questions are surfaced to the user's browser clarify panel by the web (which
 * scans the session stream for this exact tool call), and the user's answers arrive as the agent's
 * next user message when the session resumes. Used by headless ChaosWhisperer (node orchestrationMode)
 * where the native AskUserQuestion tool is unavailable (no interactive TTY).
 *
 * USAGE:
 * const text = askUserQuestionBroker({ input });
 * // Returns ContentText — a "questions sent, wait for the next user message" instruction
 */

import { askUserQuestionContract } from '@dungeonmaster/shared/contracts';

import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const askUserQuestionBroker = ({ input }: { input: unknown }): ContentText => {
  askUserQuestionContract.parse(input);

  return contentTextContract.parse(
    "Questions sent to the user. Their answers will arrive as your next user message. Do NOT continue generating — wait for the session to resume with the user's response.",
  );
};
