/**
 * PURPOSE: Wraps sessionIdExtractorTransformer from @dungeonmaster/orchestrator for CLI I/O boundary
 *
 * USAGE:
 * const sessionId = orchestratorSessionIdExtractorAdapter({ line: streamJsonLine });
 * // Returns SessionId if found in stream-json line, null otherwise
 */
import { sessionIdExtractorTransformer, type StreamJsonLine } from '@dungeonmaster/orchestrator';
import type { SessionId } from '@dungeonmaster/shared/contracts';

export const orchestratorSessionIdExtractorAdapter = ({
  line,
}: {
  line: StreamJsonLine;
}): SessionId | null => sessionIdExtractorTransformer({ line });
