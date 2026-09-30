/**
 * PURPOSE: Extracts every tool_use call from a Claude Code sub-agent transcript (JSONL), capturing each call's name and its workItemId argument (null when absent), so the SubagentStop hook can tell a work-item agent from a minion and detect a missing signal-back
 *
 * USAGE:
 * const invocations = transcriptToolInvocationsExtractTransformer({ transcript });
 * // Returns: TranscriptToolInvocation[] — one entry per assistant tool_use block across every line
 */

import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import { transcriptLineContract } from '../../contracts/transcript-line/transcript-line-contract';
import {
  transcriptToolInvocationContract,
  type TranscriptToolInvocation,
} from '../../contracts/transcript-tool-invocation/transcript-tool-invocation-contract';

export const transcriptToolInvocationsExtractTransformer = ({
  transcript,
}: {
  transcript: string;
}): TranscriptToolInvocation[] =>
  transcript.split('\n').flatMap((line): TranscriptToolInvocation[] => {
    if (line.trim() === '') {
      return [];
    }

    const parsed = safeJsonParseTransformer({ value: line });
    if (!parsed.ok) {
      return [];
    }

    const lineResult = transcriptLineContract.safeParse(parsed.value);
    if (!lineResult.success) {
      return [];
    }

    const { content } = lineResult.data.message;
    if (typeof content === 'string') {
      return [];
    }

    return content.flatMap((item): TranscriptToolInvocation[] => {
      if (item.type !== 'tool_use' || item.name === undefined) {
        return [];
      }

      const rawWorkItemId = item.input?.workItemId;
      const workItemId =
        typeof rawWorkItemId === 'string' && rawWorkItemId.length > 0 ? rawWorkItemId : null;

      return [transcriptToolInvocationContract.parse({ name: item.name, workItemId })];
    });
  });
