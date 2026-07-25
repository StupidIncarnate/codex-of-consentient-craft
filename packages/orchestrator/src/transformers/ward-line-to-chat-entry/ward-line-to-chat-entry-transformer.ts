/**
 * PURPOSE: Turns one raw ward stdout/stderr line into the assistant-text ChatEntry the web renders,
 * so a `spawnerType: 'command'` ward run streams into the same chat surface as an agent session.
 *
 * USAGE:
 * const entry = wardLineToChatEntryTransformer({ line: 'lint  @dungeonmaster/web  PASS' });
 * // Returns a ChatEntry — { role: 'assistant', type: 'text', content, uuid, timestamp }
 *
 * WHEN-TO-USE: From the responders that wire `questRunWardBroker`'s `onLine` to the chat-output
 *   bus. Ward emits plain text, never stream-json, so it needs the same shaping the chat handle
 *   broker's plain-text fallback applies to command output — not the JSONL funnel, which has
 *   nothing to parse here.
 * WHEN-NOT-TO-USE: For any Claude-produced line. Those carry structure (tool_use, thinking, usage)
 *   and MUST go through `chatLineProcessTransformer` so sub-agent correlation survives.
 */

import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';

export const wardLineToChatEntryTransformer = ({ line }: { line: string }): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'text',
    content: line,
    uuid: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
