/**
 * PURPOSE: Defines the interface for a stateful chat line processor that consumes pre-normalized Claude line objects, emits enriched entries + agent-detected signals, exposes a realAgentId→toolUseId translation map, and tracks parent-chain links for nested sub-agents so emitted entries carry parentAgentId
 *
 * WHY THE TRANSLATION MAP API:
 * Claude CLI emits sub-agent activity in TWO incompatible shapes. Streaming stdout tags every
 * sub-agent line with `parent_tool_use_id` (the Task's toolUseId). The sub-agent JSONL file on
 * disk tags lines with `agentId` (the "real" internal id that names the JSONL filename) and
 * has NO `parent_tool_use_id` field. Convergence happens by normalizing both to the streaming
 * wire shape before entry parsing — which requires a realAgentId→toolUseId reverse map owned
 * by the processor. `resolveToolUseIdForAgent` reads that map; `registerAgentTranslation`
 * lets the replay path pre-seed it during its first pass (because sub-agent JSONL lines sort
 * earlier than their completion tool_result and otherwise wouldn't find a translation when
 * they arrive). See `packages/orchestrator/CLAUDE.md` → "Two-source sub-agent correlation".
 *
 * WHY PARENT-CHAIN NESTING:
 * A sub-agent B spawned by sub-agent A (depth ≥ 2) needs its entries stamped with
 * `parentAgentId = A's chain key` so the web can group B's chain under A's chain header.
 * `registerParentChain` pre-seeds this link for the replay path; `resolveParentRealAgentId`
 * lets the live watcher route a nested sub-agent's transcript tail to the nearest ancestor.
 *
 * USAGE:
 * const processor: ChatLineProcessor = chatLineProcessTransformer();
 * processor.processLine({ parsed, source: chatLineSourceContract.parse('session') });
 */

import { z } from 'zod';

import type { AgentId } from '../agent-id/agent-id-contract';
import type { ChatLineOutput } from '../chat-line-output/chat-line-output-contract';
import type { ChatLineSource } from '../chat-line-source/chat-line-source-contract';
import type { TaskAgentToolPrompt } from '../task-agent-tool-prompt/task-agent-tool-prompt-contract';
import type { ToolUseId } from '../tool-use-id/tool-use-id-contract';

export const chatLineProcessorContract = z.object({
  processLine: z.function(),
});

export interface ChatLineProcessor {
  processLine: ({
    parsed,
    source,
    agentId,
  }: {
    parsed: unknown;
    source: ChatLineSource;
    agentId?: AgentId;
  }) => ChatLineOutput[];

  // Look up the Task toolUseId associated with a "real" internal sub-agent agentId (as
  // assigned by Claude CLI in `tool_use_result.agentId` / the subagent JSONL filename).
  // Populated as the processor sees user tool_result lines. Used by replay + subagent-tail
  // paths to translate sub-agent lines (which only carry the real agentId) into the same
  // `parent_tool_use_id` wire shape that streaming emits natively.
  resolveToolUseIdForAgent: ({ agentId }: { agentId: AgentId }) => ToolUseId | undefined;

  // Pre-seed the realAgentId→toolUseId map before processing lines. Used by the replay
  // path which does a two-pass scan: first pass registers every translation it finds in
  // the main JSONL's user tool_results, second pass processes all lines (now with the map
  // fully populated so sub-agent lines can be translated even though they arrive before
  // their completion tool_result in timestamp order).
  registerAgentTranslation: ({
    agentId,
    toolUseId,
  }: {
    agentId: AgentId;
    toolUseId: ToolUseId;
  }) => void;

  // Register the parent-chain link for a nested sub-agent: the child sub-agent's chain key
  // (childToolUseId) maps to its parent sub-agent's chain key (parentAgentId, toolUseId-form).
  // The replay pre-scan calls this before pass 2 so nested entries can be stamped with
  // parentAgentId even though the child's lines sort earlier than the spawn tool_result.
  registerParentChain: ({
    childToolUseId,
    parentAgentId,
  }: {
    childToolUseId: ToolUseId;
    parentAgentId: AgentId;
  }) => void;

  // Given a sub-agent's REAL internal agentId, return its PARENT sub-agent's REAL internal
  // agentId by walking realChild -> childChainKey -> parentChainKey -> parentReal through the
  // translation maps. Returns undefined for a top-level (depth-1) sub-agent or an unknown id.
  // The live watcher uses this to route a nested sub-agent's transcript to the nearest
  // ancestor work item.
  resolveParentRealAgentId: ({ agentId }: { agentId: AgentId }) => AgentId | undefined;

  // Pair an in-flight sub-agent's real agentId to its spawning Task by byte-equal prompt match.
  // Claude CLI writes the Task's input.prompt verbatim as the sub-agent JSONL's first user-text
  // line, so a prompt match is an id-equivalent pairing (the same one the replay path's PASS 1b
  // does in batch). When `prompt` matches an OUTSTANDING (not-yet-completed) Task, the
  // realAgentId->toolUseId translation — and the parent-chain link when that Task was itself
  // spawned by a sub-agent — is registered, then the Task is claimed so a sibling file with the
  // same prompt pairs to a different Task. Lets the live watcher start tailing a nested sub-agent
  // BEFORE its completion tool_result lands instead of waiting for it to finish. Returns true if
  // `agentId` is now (or was already) paired, false if no outstanding Task matched.
  pairSubagentByPrompt: ({
    agentId,
    prompt,
  }: {
    agentId: AgentId;
    prompt: TaskAgentToolPrompt;
  }) => boolean;
}
