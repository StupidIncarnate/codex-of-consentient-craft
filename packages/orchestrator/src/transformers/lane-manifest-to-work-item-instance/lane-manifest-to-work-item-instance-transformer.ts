/**
 * PURPOSE: Reshapes a raw `LaneManifestReading` into the `QuestWorkInstance` a router persists onto
 * `workItem.payload.instance` — extracts the bare log paths out of siegelense's nested
 * `{ path, linkPresent }` log rows, and turns an absent `apiUrl` into an explicit `null` rather than
 * an omitted key, which `questWorkInstanceContract` (`.nullable()`, never `.optional()`) requires.
 *
 * USAGE:
 * laneManifestToWorkItemInstanceTransformer({ manifest: LaneManifestReadingStub() });
 * // Returns a QuestWorkInstance with logs.api/logs.web as bare paths
 */

import type { LaneManifestReading } from '../../contracts/lane-manifest-reading/lane-manifest-reading-contract';
import { questWorkInstanceContract } from '../../contracts/quest-work-instance/quest-work-instance-contract';
import type { QuestWorkInstance } from '../../contracts/quest-work-instance/quest-work-instance-contract';

export const laneManifestToWorkItemInstanceTransformer = ({
  manifest,
}: {
  manifest: LaneManifestReading;
}): QuestWorkInstance =>
  questWorkInstanceContract.parse({
    instanceId: manifest.instanceId,
    baseUrl: manifest.baseUrl,
    apiUrl: manifest.apiUrl ?? null,
    home: manifest.home,
    logs: { api: manifest.logs.api.path, web: manifest.logs.web.path },
  });
