/**
 * PURPOSE: The assembly lives here, not in the /health responder, because five independent sources
 * (two shared-package brokers, two server-local adapters, one orchestrator adapter) must be composed
 * into one object before any HTTP concern applies — a responder's only job is translating a thrown
 * error into a status code, not gathering the data that error would report on.
 *
 * USAGE:
 * const snapshot = await healthSnapshotBroker();
 * // Returns HealthSnapshot — the seven-field body GET /api/health and the web health badge both parse
 */
import { healthSnapshotContract } from '@dungeonmaster/shared/contracts';
import type { HealthSnapshot } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeFindBroker, portResolveBroker } from '@dungeonmaster/shared/brokers';

import { orchestratorGetOrchestrationModeAdapter } from '../../../adapters/orchestrator/get-orchestration-mode/orchestrator-get-orchestration-mode-adapter';
import { processUptimeAdapter } from '../../../adapters/process/uptime/process-uptime-adapter';
import { serverPackageVersionAdapter } from '../../../adapters/server-package/version/server-package-version-adapter';

export const healthSnapshotBroker = async (): Promise<HealthSnapshot> => {
  const orchestrationMode = await orchestratorGetOrchestrationModeAdapter();
  const { homePath } = dungeonmasterHomeFindBroker();

  return healthSnapshotContract.parse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: processUptimeAdapter(),
    version: serverPackageVersionAdapter(),
    port: portResolveBroker(),
    home: homePath,
    orchestrationMode,
  });
};
