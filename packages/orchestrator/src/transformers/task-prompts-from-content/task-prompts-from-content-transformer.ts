/**
 * PURPOSE: Extracts { toolUseId, prompt } pairs from Task/Agent tool_use content items in a
 * normalized assistant JSONL entry. Claude CLI writes the Task's `input.prompt` verbatim as the
 * first user-text line of the spawned sub-agent's JSONL, so the prompt is the byte-equal pairing
 * key the processor uses to correlate an in-flight sub-agent file to its spawning Task BEFORE the
 * completion tool_result lands (live nested-sub-agent streaming).
 *
 * USAGE:
 * taskPromptsFromContentTransformer({ entry: { message: { content: [{ type: 'tool_use', name: 'Agent', id: 'toolu_01X', input: { prompt: 'do slice A' } }] } } });
 * // Returns [{ toolUseId: 'toolu_01X', prompt: 'do slice A' }]
 */

import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { taskAgentToolInputContract } from '../../contracts/task-agent-tool-input/task-agent-tool-input-contract';
import type { TaskAgentToolInput } from '../../contracts/task-agent-tool-input/task-agent-tool-input-contract';
import { toolUseIdContract } from '../../contracts/tool-use-id/tool-use-id-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';

export const taskPromptsFromContentTransformer = ({
  entry,
}: {
  entry: unknown;
}): { toolUseId: ToolUseId; prompt: TaskAgentToolInput['prompt'] }[] => {
  const lineParse = normalizedStreamLineContract.safeParse(entry);
  if (!lineParse.success) {
    return [];
  }
  const content = lineParse.data.message?.content;
  if (!Array.isArray(content)) {
    return [];
  }

  const prompts: { toolUseId: ToolUseId; prompt: TaskAgentToolInput['prompt'] }[] = [];
  for (const rawItem of content) {
    const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
    if (!itemParse.success) continue;
    const item = itemParse.data;
    if (item.type !== 'tool_use') continue;
    if (item.name !== 'Task' && item.name !== 'Agent') continue;
    if (typeof item.id !== 'string' || item.id.length === 0) continue;
    const inputParse = taskAgentToolInputContract.safeParse(item.input);
    if (!inputParse.success) continue;
    prompts.push({
      toolUseId: toolUseIdContract.parse(String(item.id)),
      prompt: inputParse.data.prompt,
    });
  }

  return prompts;
};
