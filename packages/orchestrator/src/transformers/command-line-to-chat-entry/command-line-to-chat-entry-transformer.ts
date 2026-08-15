/**
 * PURPOSE: Shapes one raw stdout/stderr line from a `spawnerType: 'command'` work item into the
 * assistant-text ChatEntry the web renders, so a deterministic command run streams into the same
 * chat surface as an agent session. Reach for this over `chatLineProcessTransformer` when the
 * producer is a plain process — ward, riftcarver — rather than Claude: there is no stream-json to
 * parse, no tool_use to map and no sub-agent to correlate, and feeding such a line through the JSONL
 * funnel drops it entirely.
 *
 * USAGE:
 * const entry = commandLineToChatEntryTransformer({ line: 'lint  @dungeonmaster/web  PASS' });
 * // Returns a ChatEntry — { role: 'assistant', type: 'text', content, uuid, timestamp }
 *
 * WHEN-NOT-TO-USE: For any Claude-produced line. Those carry structure (tool_use, thinking, usage)
 *   and MUST go through `chatLineProcessTransformer` so sub-agent correlation survives.
 */

import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';

export const commandLineToChatEntryTransformer = ({ line }: { line: string }): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'text',
    content: line,
    uuid: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
