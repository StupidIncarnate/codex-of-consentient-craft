/**
 * PURPOSE: One assistant line that launches a sub-agent through the `Agent` tool, parsed through the
 * shared stream-line contract. Reach for this over `AssistantTaskToolUseStreamLineStub` inside a
 * recipe: production code reads literals and a contract, never a `.stub`. The tool name is `Agent`
 * and the sub-agent type `general-purpose`, the pair every seeded transcript uses. The line carries
 * no `uuid` or `timestamp` — the caller spreads those over it.
 *
 * USAGE:
 * transcriptAssistantTaskToolUseLineTransformer({ toolUseId: 'toolu_1', description: 'Do it', prompt: 'Please' });
 * // Returns { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_1', name: 'Agent', input: {...} }] } }
 */

import { assistantStreamLineContract } from '@dungeonmaster/shared/contracts';
import type { AssistantStreamLine } from '@dungeonmaster/shared/contracts';

export const transcriptAssistantTaskToolUseLineTransformer = ({
  toolUseId,
  description,
  prompt,
}: {
  toolUseId: string;
  description: string;
  prompt: string;
}): AssistantStreamLine =>
  assistantStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: toolUseId,
          name: 'Agent',
          input: { description, prompt, subagent_type: 'general-purpose' },
        },
      ],
    },
  });
