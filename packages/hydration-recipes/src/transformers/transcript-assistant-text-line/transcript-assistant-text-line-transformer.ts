/**
 * PURPOSE: One assistant text line of a seeded transcript, parsed through the shared stream-line
 * contract. Reach for this over `AssistantTextStreamLineStub` inside a recipe: production code reads
 * literals and a contract, never a `.stub`. The line carries no `uuid` or `timestamp` — the caller
 * spreads those over it, since the contract would strip them.
 *
 * USAGE:
 * transcriptAssistantTextLineTransformer({ text: 'Hello', usage: { inputTokens: 1, outputTokens: 2 } });
 * // Returns { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Hello' }], usage: {...} } }
 */

import { assistantStreamLineContract } from '@dungeonmaster/shared/contracts';
import type { AssistantStreamLine } from '@dungeonmaster/shared/contracts';

export const transcriptAssistantTextLineTransformer = ({
  text,
  usage,
}: {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text }],
      ...(usage === undefined
        ? {}
        : { usage: { input_tokens: usage.inputTokens, output_tokens: usage.outputTokens } }),
    },
  });
