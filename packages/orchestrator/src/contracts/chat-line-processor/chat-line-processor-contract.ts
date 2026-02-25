/**
 * PURPOSE: Defines the interface for a stateful chat line processor that parses JSONL lines and emits enriched entries and patches
 *
 * USAGE:
 * const processor: ChatLineProcessor = chatLineProcessTransformer();
 * processor.processLine({ line, source: chatLineSourceContract.parse('session') });
 */

import { z } from 'zod';

import type { AgentId } from '../agent-id/agent-id-contract';
import type { ChatLineOutput } from '../chat-line-output/chat-line-output-contract';
import type { ChatLineSource } from '../chat-line-source/chat-line-source-contract';
import type { StreamJsonLine } from '../stream-json-line/stream-json-line-contract';

export const chatLineProcessorContract = z.object({
  processLine: z.function(),
});

export interface ChatLineProcessor {
  processLine: ({
    line,
    source,
    agentId,
  }: {
    line: StreamJsonLine;
    source: ChatLineSource;
    agentId?: AgentId;
  }) => ChatLineOutput[];
}
