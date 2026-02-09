/**
 * PURPOSE: Wraps signalFromStreamTransformer from @dungeonmaster/orchestrator for CLI I/O boundary
 *
 * USAGE:
 * const signal = orchestratorSignalFromStreamAdapter({ line: streamJsonLine });
 * // Returns StreamSignal if found in stream-json line, null otherwise
 */
import {
  signalFromStreamTransformer,
  type StreamJsonLine,
  type StreamSignal,
} from '@dungeonmaster/orchestrator';

export const orchestratorSignalFromStreamAdapter = ({
  line,
}: {
  line: StreamJsonLine;
}): StreamSignal | null => signalFromStreamTransformer({ line });
