/**
 * PURPOSE: Defines the interface for a stateful chat line processor that consumes pre-normalized Claude line objects, emits enriched entries + agent-detected signals, and exposes a realAgentId→toolUseId translation map
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
 * USAGE:
 * const processor: ChatLineProcessor = chatLineProcessTransformer();
 * processor.processLine({ parsed, source: chatLineSourceContract.parse('session') });
 */

import { z } from 'zod';

import type { AgentId } from '../agent-id/agent-id-contract';
import type { ChatLineOutput } from '../chat-line-output/chat-line-output-contract';
import type { ChatLineSource } from '../chat-line-source/chat-line-source-contract';
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
}
