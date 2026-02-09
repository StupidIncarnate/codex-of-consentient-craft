/**
 * PURPOSE: Wraps streamJsonToTextTransformer from @dungeonmaster/orchestrator for CLI I/O boundary
 *
 * USAGE:
 * const text = orchestratorStreamJsonToTextAdapter({ line: streamJsonLine });
 * // Returns StreamText if found in stream-json line, null otherwise
 */
import { streamJsonToTextTransformer, type StreamJsonLine } from '@dungeonmaster/orchestrator';

// StreamText is a branded string type from the transformer's return
type StreamText = ReturnType<typeof streamJsonToTextTransformer>;

export const orchestratorStreamJsonToTextAdapter = ({
  line,
}: {
  line: StreamJsonLine;
}): StreamText => streamJsonToTextTransformer({ line });
