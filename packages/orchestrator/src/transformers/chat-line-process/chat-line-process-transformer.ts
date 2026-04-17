/**
 * PURPOSE: Factory that creates a stateful per-session JSONL line processor which parses lines, correlates agentIds between tool_result and Task tool_use entries, and emits fully-parsed ChatEntry arrays and patches
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
import type { StreamJsonLine } from '@dungeonmaster/shared/contracts';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';
import { parseTaskNotificationTransformer } from '../parse-task-notification/parse-task-notification-transformer';
import { streamJsonToChatEntryTransformer } from '../stream-json-to-chat-entry/stream-json-to-chat-entry-transformer';
import { taskToolUseIdsFromContentTransformer } from '../task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer';
import { toolUseIdsFromContentTransformer } from '../tool-use-ids-from-content/tool-use-ids-from-content-transformer';

const TASK_NOTIFICATION_PREFIX = '<task-notification>';

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

          if (agentId !== undefined && Reflect.get(parsed, 'agentId') === undefined) {
            Reflect.set(parsed, 'agentId', agentId);
          }

          // Parse <task-notification> XML into structured data on the server side so the web
          // doesn't need to run regex over raw content. Claude CLI appends these user messages
          // to the main session JSONL when a background agent completes; they carry task-id,
          // status, and optional summary/result/usage fields. Attach the parsed result as
          // `taskNotification` on the entry — the ChatEntry parser reads it to build a
          // task_notification ChatEntry directly.
          const message: unknown = Reflect.get(parsed, 'message');
          if (typeof message === 'object' && message !== null) {
            const content: unknown = Reflect.get(message, 'content');
            if (
              typeof content === 'string' &&
              content.trimStart().startsWith(TASK_NOTIFICATION_PREFIX)
            ) {
              const taskData = parseTaskNotificationTransformer({ content });
              if (taskData !== null) {
                Reflect.set(parsed, 'taskNotification', taskData);
              }
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
      } catch {
        return [];
      }
    },
  };
};
