/**
 * PURPOSE: Factory that creates a stateful per-session JSONL line processor which parses lines, correlates agentIds between tool_result and Task tool_use entries, and emits enriched entries and patches
 *
 * USAGE:
 * const processor = chatLineProcessTransformer();
 * const outputs = processor.processLine({ line: StreamJsonLineStub(), source: chatLineSourceContract.parse('session') });
 * // Returns array of ChatLineOutput (entries and/or patches)
 */

import { agentIdContract } from '../../contracts/agent-id/agent-id-contract';
import type { AgentId } from '../../contracts/agent-id/agent-id-contract';
import { chatLineOutputContract } from '../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineOutput } from '../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineProcessor } from '../../contracts/chat-line-processor/chat-line-processor-contract';
import type { ChatLineSource } from '../../contracts/chat-line-source/chat-line-source-contract';
import type { StreamJsonLine } from '../../contracts/stream-json-line/stream-json-line-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';
import { taskToolUseIdsFromContentTransformer } from '../task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer';
import { toolUseIdsFromContentTransformer } from '../tool-use-ids-from-content/tool-use-ids-from-content-transformer';

export const chatLineProcessTransformer = (): ChatLineProcessor => {
  const agentIdMap = new Map<ToolUseId, AgentId>();
  const emittedToolUseIds = new Set<ToolUseId>();

  return {
    processLine: ({
      line,
      source,
      agentId,
    }: {
      line: StreamJsonLine;
      source: ChatLineSource;
      agentId?: AgentId;
    }): ChatLineOutput[] => {
      try {
        const parsed: unknown = JSON.parse(line);

        if (typeof parsed !== 'object' || parsed === null) {
          return [];
        }

        const entryType: unknown = Reflect.get(parsed, 'type');

        if (entryType !== 'user' && entryType !== 'assistant') {
          return [];
        }

        const outputs: ChatLineOutput[] = [];

        Reflect.set(parsed, 'source', source);

        if (entryType === 'user') {
          const toolUseResult: unknown = Reflect.get(parsed, 'toolUseResult');
          if (typeof toolUseResult === 'object' && toolUseResult !== null) {
            const resultAgentId: unknown = Reflect.get(toolUseResult, 'agentId');
            if (typeof resultAgentId === 'string') {
              const parsedAgentId = agentIdContract.parse(resultAgentId);
              const entry = parsed as Parameters<
                typeof toolUseIdsFromContentTransformer
              >[0]['entry'];
              const toolUseIds = toolUseIdsFromContentTransformer({ entry });
              for (const toolUseId of toolUseIds) {
                agentIdMap.set(toolUseId, parsedAgentId);

                if (emittedToolUseIds.has(toolUseId)) {
                  outputs.push(
                    chatLineOutputContract.parse({
                      type: 'patch',
                      toolUseId,
                      agentId: parsedAgentId,
                    }),
                  );
                }
              }
              Reflect.set(parsed, 'agentId', parsedAgentId);
            }
          }
        }

        if (entryType === 'assistant') {
          const entry = parsed as Parameters<
            typeof taskToolUseIdsFromContentTransformer
          >[0]['entry'];
          const taskToolUseIds = taskToolUseIdsFromContentTransformer({ entry });
          for (const toolUseId of taskToolUseIds) {
            const knownAgentId = agentIdMap.get(toolUseId);
            if (knownAgentId !== undefined) {
              Reflect.set(parsed, 'agentId', knownAgentId);
            }
            emittedToolUseIds.add(toolUseId);
          }

          if (agentId !== undefined && Reflect.get(parsed, 'agentId') === undefined) {
            Reflect.set(parsed, 'agentId', agentId);
          }
        }

        outputs.push(chatLineOutputContract.parse({ type: 'entry', entry: parsed }));

        return outputs;
      } catch {
        return [];
      }
    },
  };
};
