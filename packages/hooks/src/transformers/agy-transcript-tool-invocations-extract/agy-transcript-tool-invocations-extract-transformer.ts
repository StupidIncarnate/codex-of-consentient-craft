/**
 * PURPOSE: Extracts tool invocations from an Antigravity transcript (JSONL), capturing each call's
 * name and optional workItemId argument, so the Antigravity Stop hook can verify signal-back calls
 *
 * USAGE:
 * const invocations = agyTranscriptToolInvocationsExtractTransformer({ transcript });
 * // Returns: TranscriptToolInvocation[]
 */

import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import { dungeonmasterMcpToolsStatics } from '../../statics/dungeonmaster-mcp-tools/dungeonmaster-mcp-tools-statics';
import {
  transcriptToolInvocationContract,
  type TranscriptToolInvocation,
} from '../../contracts/transcript-tool-invocation/transcript-tool-invocation-contract';
import { agyTranscriptLineContract } from '../../contracts/agy-transcript-line/agy-transcript-line-contract';

export const agyTranscriptToolInvocationsExtractTransformer = ({
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

    const lineResult = agyTranscriptLineContract.safeParse(parsed.value);
    if (!lineResult.success || !lineResult.data.tool_calls) {
      return [];
    }

    return lineResult.data.tool_calls.flatMap((call): TranscriptToolInvocation[] => {
      if (typeof call.name !== 'string' || call.name.length === 0) {
        return [];
      }

      let toolName = call.name;
      if (toolName === 'get-agent-prompt') {
        toolName = dungeonmasterMcpToolsStatics.getAgentPromptToolName;
      } else if (toolName === 'signal-back') {
        toolName = dungeonmasterMcpToolsStatics.signalBackToolName;
      }

      const rawWorkItemId = call.args?.workItemId;
      const workItemId =
        typeof rawWorkItemId === 'string' && rawWorkItemId.length > 0 ? rawWorkItemId : null;

      return [transcriptToolInvocationContract.parse({ name: toolName, workItemId })];
    });
  });
