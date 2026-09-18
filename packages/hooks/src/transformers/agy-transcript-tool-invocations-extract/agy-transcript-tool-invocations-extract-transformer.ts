/**
 * PURPOSE: Extracts tool invocations from an Antigravity transcript (JSONL), capturing each call's
 * name and optional workItemId argument, supporting direct calls and call_mcp_tool envelopes,
 * so the Antigravity Stop hook can verify signal-back calls
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

const TOOL_NAME_PATTERN = /"(?:ToolName|tool_name|name)"\s*:\s*"([^"]+)"/u;
const WORK_ITEM_ID_PATTERN = /"workItemId"\s*:\s*"([^"]+)"/u;

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

      let toolName = call.name.replace(/^"(.*)"$/u, '$1');

      const serializedArgs = call.args ? JSON.stringify(call.args).replace(/\\"/gu, '"') : '';

      if (toolName === 'call_mcp_tool' && serializedArgs.length > 0) {
        const toolMatch = TOOL_NAME_PATTERN.exec(serializedArgs);
        const matchedTool = toolMatch?.[1];
        if (matchedTool !== undefined && matchedTool.length > 0) {
          toolName = matchedTool.replace(/^"(.*)"$/u, '$1');
        }
      }

      if (
        toolName === 'get-agent-prompt' ||
        toolName === dungeonmasterMcpToolsStatics.getAgentPromptToolName
      ) {
        toolName = dungeonmasterMcpToolsStatics.getAgentPromptToolName;
      } else if (
        toolName === 'signal-back' ||
        toolName === dungeonmasterMcpToolsStatics.signalBackToolName
      ) {
        toolName = dungeonmasterMcpToolsStatics.signalBackToolName;
      }

      const workItemMatch = WORK_ITEM_ID_PATTERN.exec(serializedArgs);
      const matchedWorkId = workItemMatch?.[1];
      const workItemId =
        matchedWorkId !== undefined && matchedWorkId.length > 0
          ? matchedWorkId.replace(/^"+|"+$/gu, '')
          : null;

      return [transcriptToolInvocationContract.parse({ name: toolName, workItemId })];
    });
  });
