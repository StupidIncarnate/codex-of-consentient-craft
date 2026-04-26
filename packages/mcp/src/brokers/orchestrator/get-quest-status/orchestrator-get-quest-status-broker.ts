/**
 * PURPOSE: Fetches orchestration status from the dungeonmaster server's HTTP endpoint
 *
 * USAGE:
 * const status = await orchestratorGetQuestStatusBroker({ processId });
 * // Returns: OrchestrationStatus by hitting GET /api/process/:processId on the dev/prod server.
 * // The MCP runs as a separate node process spawned by Claude CLI, so it cannot reach the
 * // server's in-memory orchestrationProcessesState directly — it bridges via HTTP.
 */

import { fetchGetAdapter } from '@dungeonmaster/shared/adapters';
import { portResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  orchestrationStatusContract,
  type OrchestrationStatus,
  type ProcessId,
} from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';

export const orchestratorGetQuestStatusBroker = async ({
  processId,
}: {
  processId: ProcessId;
}): Promise<OrchestrationStatus> => {
  const port = portResolveBroker();
  // Use environmentStatics.hostname (the same hostname the server binds to via
  // honoServeAdapter) instead of "localhost". Node's fetch DNS-resolves the
  // hostname; "localhost" can pick the wrong family (IPv4 127.0.0.1 vs IPv6 ::1)
  // when the server only listens on one of them, producing "fetch failed" with
  // ECONNREFUSED. Resolving the same hostname both sides bind/fetch through
  // keeps them aligned regardless of the host's /etc/hosts configuration.
  const url = `http://${environmentStatics.hostname}:${String(port)}/api/process/${processId}`;

  try {
    const response = await fetchGetAdapter<unknown>({ url });
    return orchestrationStatusContract.parse(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Process not found')) {
      throw new Error(`Process not found: ${processId}`, { cause: error });
    }
    throw error instanceof Error ? error : new Error(message, { cause: error });
  }
};
