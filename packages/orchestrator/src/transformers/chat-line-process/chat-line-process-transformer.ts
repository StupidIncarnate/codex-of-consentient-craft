/**
 * PURPOSE: Factory that creates a stateful per-session processor for pre-normalized Claude line objects, reconciling the two Claude CLI sub-agent source formats (streaming stdout with `parent_tool_use_id`, and JSONL files keyed by real internal agentId) into a single `ChatEntry[]` shape where the Task toolUseId is the wire-level chain key. Also lifts inflated <task-notification> XML, emits `agent-detected` signals so the sub-agent JSONL tail can bootstrap itself, and stamps `parentAgentId` on entries from nested sub-agents (depth ≥ 2).
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

import { chatEntryContract } from '@dungeonmaster/shared/contracts';

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
import type { TaskAgentToolPrompt } from '../../contracts/task-agent-tool-prompt/task-agent-tool-prompt-contract';
import { toolUseIdContract } from '../../contracts/tool-use-id/tool-use-id-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';
import { streamJsonToChatEntryTransformer } from '../stream-json-to-chat-entry/stream-json-to-chat-entry-transformer';
import { taskPromptsFromContentTransformer } from '../task-prompts-from-content/task-prompts-from-content-transformer';
import { taskToolUseIdsFromContentTransformer } from '../task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer';
import { toolUseIdsFromContentTransformer } from '../tool-use-ids-from-content/tool-use-ids-from-content-transformer';

const NUMERIC_TASK_NOTIFICATION_KEYS = new Set(['totalTokens', 'toolUses', 'durationMs']);

export const chatLineProcessTransformer = (): ChatLineProcessor => {
  // Forward map: toolUseId → realAgentId, populated as user tool_result lines are processed.
  const agentIdMap = new Map<ToolUseId, AgentId>();
  // Reverse map: realAgentId → toolUseId, kept in sync so file-sourced sub-agent lines
  // (tagged with realAgentId) can resolve back to the Task toolUseId in O(1).
  const reverseAgentIdMap = new Map<AgentId, ToolUseId>();
  // Parent-chain map: childChainKey (ToolUseId) → parentChainKey (AgentId, toolUseId-form).
  // Populated live when a nested tool_result is processed and by registerParentChain for replay.
  const parentChainMap = new Map<ToolUseId, AgentId>();

  // Outstanding Task prompts: toolUseId → { prompt, containerChainKey }. A Task is "outstanding"
  // from the moment its assistant tool_use line is processed until its completion tool_result
  // lands. `pairSubagentByPrompt` matches an in-flight sub-agent JSONL's first-line prompt against
  // these so the live watcher can correlate (and start tailing) a nested sub-agent BEFORE it
  // finishes. `containerChainKey` is the chain key of the line that spawned the Task (undefined
  // for top-level Tasks in the main session, set when one sub-agent spawned another) so the pair
  // can also register the parent-chain link for nested grouping.
  const outstandingTasks = new Map<
    ToolUseId,
    { prompt: TaskAgentToolPrompt; containerChainKey: AgentId | undefined }
  >();

  return {
    pairSubagentByPrompt: ({
      agentId: realAgentId,
      prompt,
    }: {
      agentId: AgentId;
      prompt: TaskAgentToolPrompt;
    }): boolean => {
      if (reverseAgentIdMap.has(realAgentId)) {
        return true;
      }
      for (const [toolUseId, info] of outstandingTasks) {
        if (info.prompt !== prompt) continue;
        // Claim the Task so a sibling file with an identical prompt pairs to a different Task
        // (matches replay PASS 1b's first-unclaimed semantics).
        outstandingTasks.delete(toolUseId);
        agentIdMap.set(toolUseId, realAgentId);
        reverseAgentIdMap.set(realAgentId, toolUseId);
        if (info.containerChainKey !== undefined) {
          parentChainMap.set(toolUseId, info.containerChainKey);
        }
        return true;
      }
      return false;
    },
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
    registerParentChain: ({
      childToolUseId,
      parentAgentId,
    }: {
      childToolUseId: ToolUseId;
      parentAgentId: AgentId;
    }): void => {
      parentChainMap.set(childToolUseId, parentAgentId);
    },
    resolveParentRealAgentId: ({
      agentId: realChild,
    }: {
      agentId: AgentId;
    }): AgentId | undefined => {
      const childChainKey = reverseAgentIdMap.get(realChild);
      if (childChainKey === undefined) return undefined;
      const parentChainKey = parentChainMap.get(childChainKey);
      if (parentChainKey === undefined) return undefined;
      return agentIdMap.get(toolUseIdContract.parse(String(parentChainKey)));
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
        if (
          toolUseResult !== undefined &&
          typeof toolUseResult !== 'string' &&
          !Array.isArray(toolUseResult)
        ) {
          const resultAgentId = toolUseResult.agentId;
          if (typeof resultAgentId === 'string') {
            const parsedAgentId = agentIdContract.parse(resultAgentId);
            const toolUseIds = toolUseIdsFromContentTransformer({ entry: original });
            for (const toolUseId of toolUseIds) {
              // This Task has completed — drop it from the outstanding pool so a late-arriving
              // sub-agent file with the same prompt no longer pairs to a finished Task.
              outstandingTasks.delete(toolUseId);
              // Update BOTH maps — the reverse map is the hot path for sub-agent lines
              // arriving from the file source (tagged with realAgentId from the JSONL
              // filename) that need translation back to the Task toolUseId.
              agentIdMap.set(toolUseId, parsedAgentId);
              reverseAgentIdMap.set(parsedAgentId, toolUseId);
              // If the current line is itself from a sub-agent (its own chain key is set),
              // record that the child sub-agent's chain key links to this sub-agent's chain
              // key so nested entries can be stamped with parentAgentId.
              if (typeof original.agentId === 'string' && String(original.agentId).length > 0) {
                parentChainMap.set(toolUseId, agentIdContract.parse(String(original.agentId)));
              }
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

        // Record each Task/Agent this line spawned as outstanding so an in-flight sub-agent
        // JSONL can be paired to it by prompt (pairSubagentByPrompt) before its completion
        // tool_result lands. The container chain key is THIS line's own chain key — undefined for
        // a top-level Task in the main session, set when one sub-agent spawned another (so the
        // pair can register the parent-chain link for nested grouping).
        const containerChainKey =
          typeof original.agentId === 'string' && String(original.agentId).length > 0
            ? agentIdContract.parse(String(original.agentId))
            : undefined;
        for (const { toolUseId, prompt } of taskPromptsFromContentTransformer({
          entry: original,
        })) {
          outstandingTasks.set(toolUseId, { prompt, containerChainKey });
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

      const ownChainKeyRaw = original.agentId;
      const ownChainKey =
        typeof ownChainKeyRaw === 'string' && String(ownChainKeyRaw).length > 0
          ? String(ownChainKeyRaw)
          : undefined;
      const parentAgentIdVal =
        ownChainKey === undefined
          ? undefined
          : parentChainMap.get(toolUseIdContract.parse(ownChainKey));

      const { entries } = streamJsonToChatEntryTransformer({ parsed: original });
      const stampedEntries = entries.map((entry) => {
        const entryAgentIdRaw =
          'agentId' in entry && typeof entry.agentId === 'string' && entry.agentId.length > 0
            ? String(entry.agentId)
            : undefined;
        // A nested Task/Agent tool_use entry's own agentId is the chain it LAUNCHES (the
        // Task's toolUseId), which differs from this line's chain key (ownChainKey). Its
        // PARENT is the chain this line belongs to, so stamp parentAgentId = ownChainKey —
        // the linkage the web's recursive grouping reparents the launched chain on. Without
        // this the launched chain renders at the top level instead of nested under its
        // spawning sub-agent. Top-level Tasks (ownChainKey undefined) get no parentAgentId,
        // leaving their chain at the top level.
        if (
          ownChainKey !== undefined &&
          entryAgentIdRaw !== undefined &&
          entryAgentIdRaw !== ownChainKey
        ) {
          return chatEntryContract.parse({ ...entry, parentAgentId: ownChainKey });
        }
        // Every other entry shares this line's chain key — it gets this chain's own parent
        // link (set for depth ≥ 2 sub-agents, absent for top-level chains).
        if (parentAgentIdVal === undefined) {
          return entry;
        }
        return chatEntryContract.parse({ ...entry, parentAgentId: parentAgentIdVal });
      });
      outputs.push(chatLineOutputContract.parse({ type: 'entries', entries: stampedEntries }));

      return outputs;
    },
  };
};
