/**
 * PURPOSE: Lives in `shared`, not the server, because both the server producing this body and the
 * web widgets parsing it (the health badge and the /health page) need to hold one identical type
 * rather than two shapes that can drift apart. Unknown keys are stripped rather than rejected, so a
 * future server-only field can't flip the web badge to OFFLINE.
 *
 * USAGE:
 * healthSnapshotContract.parse(body);
 * // Returns: HealthSnapshot — unknown keys are stripped, never rejected, so a future server-only
 * // field can't flip the web badge to OFFLINE
 */
import { z } from 'zod';

import { filePathContract } from '../file-path/file-path-contract';
import { networkPortContract } from '../network-port/network-port-contract';
import { orchestrationModeContract } from '../orchestration-mode/orchestration-mode-contract';

export const healthSnapshotContract = z.object({
  status: z.literal('ok').brand<'HealthStatus'>(),
  timestamp: z.string().datetime().brand<'IsoTimestamp'>(),
  uptimeSeconds: z.number().int().nonnegative().brand<'UptimeSeconds'>(),
  version: z.string().min(1).brand<'PackageVersion'>(),
  port: networkPortContract,
  home: filePathContract,
  orchestrationMode: orchestrationModeContract,
});

export type HealthSnapshot = z.infer<typeof healthSnapshotContract>;
