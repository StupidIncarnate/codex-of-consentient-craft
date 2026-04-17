/**
 * PURPOSE: Defines the interface for a stateful chat line processor that consumes pre-normalized Claude line objects and emits enriched entries and patches
 *
 * USAGE:
 * const processor: ChatLineProcessor = chatLineProcessTransformer();
 * processor.processLine({ parsed, source: chatLineSourceContract.parse('session') });
 */

import { z } from 'zod';

import type { AgentId } from '../agent-id/agent-id-contract';
import type { ChatLineOutput } from '../chat-line-output/chat-line-output-contract';
import type { ChatLineSource } from '../chat-line-source/chat-line-source-contract';

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
}
