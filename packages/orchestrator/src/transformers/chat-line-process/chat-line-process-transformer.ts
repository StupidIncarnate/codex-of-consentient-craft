/**
 * PURPOSE: Factory that creates a stateful per-session processor for pre-normalized Claude line objects, reconciling the two Claude CLI sub-agent source formats (streaming stdout with `parent_tool_use_id`, and JSONL files keyed by real internal agentId) into a single `ChatEntry[]` shape where the Task toolUseId is the wire-level chain key. Also lifts inflated <task-notification> XML and emits `agent-detected` signals so the sub-agent JSONL tail can bootstrap itself.
 *
 * USAGE:
 * const processor = chatLineProcessTransformer();
 * const outputs = processor.processLine({ parsed: normalizedObject, source: chatLineSourceContract.parse('session') });
 * // Returns array of ChatLineOutput (entries and/or agent-detected)
 *
 * TWO-SOURCE CONVERGENCE:
 * Sub-agent correlation arrives in two incompatible shapes depending on where the line came from:
 *   - STREAMING (stdout): every sub-agent line has `parent_tool_use_id` = the Task's toolUseId.
 *   - FILE (sub-agent JSONL on disk): lines have `agentId` = the "real" internal id Claude CLI
 *     assigned (= the JSONL filename). No `parent_tool_use_id` field at all.
 * The translation between the two lives in the MAIN session JSONL's user tool_result lines,
 * which carry `tool_use_result.agentId` (real id) beside the Task's `tool_use_id`.
 *
 * Convergence strategy: normalize everything to the streaming wire shape (`parent_tool_use_id`)
 * BEFORE entry parsing. For file-sourced lines, resolve the Task toolUseId via the realAgentId
 * translation map (populated as user tool_results are seen, and pre-seeded by the replay path
 * to cover lines that arrive before their completion tool_result in timestamp order). After
 * that normalization step, downstream code never has to know the source format.
 */

import { agentIdContract } from '../../contracts/agent-id/agent-id-contract';
import type { AgentId } from '../../contracts/agent-id/agent-id-contract';
import { chatLineOutputContract } from '../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineOutput } from '../../contracts/chat-line-output/chat-line-output-contract';
import type { ChatLineProcessor } from '../../contracts/chat-line-processor/chat-line-processor-contract';
import type { ChatLineSource } from '../../contracts/chat-line-source/chat-line-source-contract';
import { inflatedTaskNotificationContentContract } from '../../contracts/inflated-task-notification-content/inflated-task-notification-content-contract';
import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import {
  normalizedStreamLineContract,
  type NormalizedStreamLine,
} from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';
import { streamJsonToChatEntryTransformer } from '../stream-json-to-chat-entry/stream-json-to-chat-entry-transformer';
import { taskToolUseIdsFromContentTransformer } from '../task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer';
import { toolUseIdsFromContentTransformer } from '../tool-use-ids-from-content/tool-use-ids-from-content-transformer';

const NUMERIC_TASK_NOTIFICATION_KEYS = new Set(['totalTokens', 'toolUses', 'durationMs']);

export const chatLineProcessTransformer = (): ChatLineProcessor => {
  // Forward map: toolUseId → realAgentId, populated as user tool_result lines are processed.
  const agentIdMap = new Map<ToolUseId, AgentId>();
  // Reverse map: realAgentId → toolUseId, kept in sync so file-sourced sub-agent lines
  // (tagged with realAgentId) can resolve back to the Task toolUseId in O(1).
  const reverseAgentIdMap = new Map<AgentId, ToolUseId>();

  return {
    resolveToolUseIdForAgent: ({
      agentId: realAgentId,
    }: {
      agentId: AgentId;
    }): ToolUseId | undefined => reverseAgentIdMap.get(realAgentId),
    registerAgentTranslation: ({
      agentId: realAgentId,
      toolUseId,
    }: {
      agentId: AgentId;
      toolUseId: ToolUseId;
    }): void => {
      agentIdMap.set(toolUseId, realAgentId);
      reverseAgentIdMap.set(realAgentId, toolUseId);
    },
    processLine: ({
      parsed,
      source,
      agentId,
    }: {
      parsed: unknown;
      source: ChatLineSource;
      agentId?: AgentId;
    }): ChatLineOutput[] => {
      // Validate the post-normalize line shape once. Mutations below operate on the
      // ORIGINAL `parsed` reference so downstream consumers (streamJsonToChatEntryTransformer
      // and the recursive call back through the chat-line funnel) observe stamped fields.
      const lineParse = normalizedStreamLineContract.safeParse(parsed);
      if (!lineParse.success) {
        return [];
      }
      const entryType = lineParse.data.type;

      if (entryType !== 'user' && entryType !== 'assistant') {
        return [];
      }

      // Validation above confirmed the shape. Mutate fields on the ORIGINAL parsed object
      // so the rest of the pipeline reads the stamped values.
      const original = parsed as NormalizedStreamLine;
      const outputs: ChatLineOutput[] = [];

      original.source = source as unknown as NormalizedStreamLine['source'];

      // STEP 1: normalize to the streaming wire shape.
      //
      // Streaming path: line already has `parent_tool_use_id` — use it directly.
      // File path: line has no `parent_tool_use_id` but the caller passed an `agentId` param
      // (the real internal id from the subagent JSONL filename). Resolve that to the Task's
      // toolUseId via the reverse map and stamp `parent_tool_use_id` synthetically so the
      // rest of this function is source-agnostic.
      let parentToolUseIdVal: NormalizedStreamLine['parentToolUseId'] = original.parentToolUseId;
      if (
        (typeof parentToolUseIdVal !== 'string' || parentToolUseIdVal.length === 0) &&
        agentId !== undefined
      ) {
        const translated = reverseAgentIdMap.get(agentId);
        if (translated !== undefined) {
          parentToolUseIdVal = translated as unknown as NormalizedStreamLine['parentToolUseId'];
          original.parentToolUseId =
            translated as unknown as NormalizedStreamLine['parentToolUseId'];
        }
      }

      const isSubagentByParent =
        typeof parentToolUseIdVal === 'string' && parentToolUseIdVal.length > 0;
      if (isSubagentByParent) {
        original.source = 'subagent' as unknown as NormalizedStreamLine['source'];
        original.agentId = parentToolUseIdVal as unknown as NormalizedStreamLine['agentId'];
      }

      if (entryType === 'user') {
        // tool_use_result.agentId is the "real" internal sub-agent id Claude CLI assigns.
        // We do NOT use it as the wire-level correlation key for the web — parent_tool_use_id
        // (handled above) is stable and known from the first streamed line. Instead, we emit
        // `agent-detected` outputs so chat-spawn-broker can start tailing the sub-agent's
        // JSONL file (needed to bridge the streaming ↔ file gap for resumed sessions and
        // background task-notifications). We also record the realAgentId↔toolUseId mapping
        // in agentIdMap so the history replay path can translate sub-agent JSONL lines
        // (tagged with realAgentId) into the same `parent_tool_use_id` wire shape.
        const { toolUseResult } = original;
        if (toolUseResult !== undefined) {
          const resultAgentId = toolUseResult.agentId;
          if (typeof resultAgentId === 'string') {
            const parsedAgentId = agentIdContract.parse(resultAgentId);
            const toolUseIds = toolUseIdsFromContentTransformer({ entry: original });
            for (const toolUseId of toolUseIds) {
              // Update BOTH maps — the reverse map is the hot path for sub-agent lines
              // arriving from the file source (tagged with realAgentId from the JSONL
              // filename) that need translation back to the Task toolUseId.
              agentIdMap.set(toolUseId, parsedAgentId);
              reverseAgentIdMap.set(parsedAgentId, toolUseId);
              outputs.push(
                chatLineOutputContract.parse({
                  type: 'agent-detected',
                  toolUseId,
                  agentId: parsedAgentId,
                }),
              );
            }
          }
        }

        if (agentId !== undefined && original.agentId === undefined) {
          original.agentId = agentId as unknown as NormalizedStreamLine['agentId'];
        }

        // Lift inflated <task-notification> XML from message.content into a top-level
        // taskNotification field so parse-user-stream-entry can build a task_notification
        // ChatEntry from it. The XML inflater turned the content string into
        // { taskNotification: { taskId, status, summary?, result?, totalTokens?, toolUses?, durationMs? } }
        // and emits totalTokens/toolUses/durationMs as STRINGS (parseTagValue: false on the
        // adapter), so we coerce those three to numbers here to satisfy the ChatEntry contract.
        const { message } = original;
        if (message !== undefined) {
          const { content } = message;
          const inflatedParse = inflatedTaskNotificationContentContract.safeParse(content);
          if (inflatedParse.success) {
            const { taskNotification } = inflatedParse.data;
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
              original.taskNotification = lifted as NormalizedStreamLine['taskNotification'];
            }
          }
        }
      }

      if (entryType === 'assistant') {
        // Calling this transformer has a side effect: it eagerly stamps `agentId = item.id`
        // on every Task/Agent tool_use content item. That's the wire-level correlation key
        // the web uses to group the chain — matching sub-agent lines tagged via
        // parent_tool_use_id (streaming) or the agentId translation map (file replay).
        taskToolUseIdsFromContentTransformer({ entry: original });

        if (agentId !== undefined && original.agentId === undefined) {
          original.agentId = agentId as unknown as NormalizedStreamLine['agentId'];
        }

        // Strip content items that carry extended-thinking blocks with empty text.
        // Claude CLI redacts the reasoning text when extended thinking is enabled — it
        // emits `{ type: 'thinking', thinking: '', signature: '<encrypted>' }` so the
        // downstream caller can preserve cache continuity without exposing the reasoning.
        // Nothing renders from these blocks; dropping them on the server side avoids the
        // web having to filter empty "THINKING" labels.
        const { message } = original;
        if (message !== undefined) {
          const { content } = message;
          if (Array.isArray(content)) {
            const filtered = content.filter((rawItem: unknown) => {
              const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
              if (!itemParse.success) return true;
              const itm = itemParse.data;
              if (itm.type !== 'thinking') return true;
              return typeof itm.thinking === 'string' && itm.thinking.length > 0;
            });
            if (filtered.length !== content.length) {
              message.content = filtered;
            }
          }
        }
      }

      const { entries } = streamJsonToChatEntryTransformer({ parsed: original });
      outputs.push(chatLineOutputContract.parse({ type: 'entries', entries }));

      return outputs;
    },
  };
};
