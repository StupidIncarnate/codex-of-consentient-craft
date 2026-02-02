/**
 * PURPOSE: Wraps streamJsonToToolUseTransformer from @dungeonmaster/orchestrator for CLI I/O boundary
 *
 * USAGE:
 * const toolUse = orchestratorStreamJsonToToolUseAdapter({ line: streamJsonLine });
 * // Returns ToolUseDisplay if found in stream-json line, null otherwise
 */
import { streamJsonToToolUseTransformer, type StreamJsonLine } from '@dungeonmaster/orchestrator';

// ToolUseDisplay is a branded string type from the transformer's return
type ToolUseDisplay = ReturnType<typeof streamJsonToToolUseTransformer>;

export const orchestratorStreamJsonToToolUseAdapter = ({
  line,
}: {
  line: StreamJsonLine;
}): ToolUseDisplay => streamJsonToToolUseTransformer({ line });
