/**
 * PURPOSE: Factory that creates a stateful per-session processor for pre-normalized Claude line objects, correlating agentIds between tool_result and Task tool_use entries, lifting inflated <task-notification> XML, and emitting fully-parsed ChatEntry arrays and patches
 *
 * USAGE:
 * const processor = chatLineProcessTransformer();
 * const outputs = processor.processLine({ parsed: normalizedObject, source: chatLineSourceContract.parse('session') });
 * // Returns array of ChatLineOutput (entries and/or patches)
 */

import { agentIdContract } from '../../contracts/agent-id/agent-id-contract';
import type { AgentId } from '../../contracts/agent-id/agent-id-contract';
import { chatLineOutputContract } from '../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineOutput } from '../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineProcessor } from '../../contracts/chat-line-processor/chat-line-processor-contract';
import type { ChatLineSource } from '../../contracts/chat-line-source/chat-line-source-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';
import { streamJsonToChatEntryTransformer } from '../stream-json-to-chat-entry/stream-json-to-chat-entry-transformer';
import { taskToolUseIdsFromContentTransformer } from '../task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer';
import { toolUseIdsFromContentTransformer } from '../tool-use-ids-from-content/tool-use-ids-from-content-transformer';

const NUMERIC_TASK_NOTIFICATION_KEYS = new Set(['totalTokens', 'toolUses', 'durationMs']);

export const chatLineProcessTransformer = (): ChatLineProcessor => {
  const agentIdMap = new Map<ToolUseId, AgentId>();
  const emittedToolUseIds = new Set<ToolUseId>();

  return {
    processLine: ({
      parsed,
      source,
      agentId,
    }: {
      parsed: unknown;
      source: ChatLineSource;
      agentId?: AgentId;
    }): ChatLineOutput[] => {
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
            const entry = parsed as Parameters<typeof toolUseIdsFromContentTransformer>[0]['entry'];
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

        if (agentId !== undefined && Reflect.get(parsed, 'agentId') === undefined) {
          Reflect.set(parsed, 'agentId', agentId);
        }

        // Lift inflated <task-notification> XML from message.content into a top-level
        // taskNotification field so parse-user-stream-entry can build a task_notification
        // ChatEntry from it. The XML inflater turned the content string into
        // { taskNotification: { taskId, status, summary?, result?, totalTokens?, toolUses?, durationMs? } }
        // and emits totalTokens/toolUses/durationMs as STRINGS (parseTagValue: false on the
        // adapter), so we coerce those three to numbers here to satisfy the ChatEntry contract.
        const message: unknown = Reflect.get(parsed, 'message');
        if (typeof message === 'object' && message !== null) {
          const content: unknown = Reflect.get(message, 'content');
          if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
            const taskNotification: unknown = Reflect.get(content, 'taskNotification');
            if (typeof taskNotification === 'object' && taskNotification !== null) {
              const lifted: Record<PropertyKey, unknown> = {};
              for (const [k, v] of Object.entries(taskNotification)) {
                if (NUMERIC_TASK_NOTIFICATION_KEYS.has(k) && typeof v === 'string') {
                  const num = Number(v);
                  if (!Number.isNaN(num)) {
                    lifted[k] = num;
                    continue;
                  }
                }
                lifted[k] = v;
              }
              Reflect.set(parsed, 'taskNotification', lifted);
            }
          }
        }
      }

      if (entryType === 'assistant') {
        const entry = parsed as Parameters<typeof taskToolUseIdsFromContentTransformer>[0]['entry'];
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

        // Strip content items that carry extended-thinking blocks with empty text.
        // Claude CLI redacts the reasoning text when extended thinking is enabled — it
        // emits `{ type: 'thinking', thinking: '', signature: '<encrypted>' }` so the
        // downstream caller can preserve cache continuity without exposing the reasoning.
        // Nothing renders from these blocks; dropping them on the server side avoids the
        // web having to filter empty "THINKING" labels.
        const message: unknown = Reflect.get(parsed, 'message');
        if (typeof message === 'object' && message !== null) {
          const content: unknown = Reflect.get(message, 'content');
          if (Array.isArray(content)) {
            const filtered = content.filter((item: unknown) => {
              if (typeof item !== 'object' || item === null) return true;
              if (Reflect.get(item, 'type') !== 'thinking') return true;
              const thinkingText: unknown = Reflect.get(item, 'thinking');
              return typeof thinkingText === 'string' && thinkingText.length > 0;
            });
            if (filtered.length !== content.length) {
              Reflect.set(message, 'content', filtered);
            }
          }
        }
      }

      const { entries } = streamJsonToChatEntryTransformer({ parsed });
      outputs.push(chatLineOutputContract.parse({ type: 'entries', entries }));

      return outputs;
    },
  };
};
