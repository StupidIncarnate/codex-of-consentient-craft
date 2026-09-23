/**
 * PURPOSE: What `laneProvisionBatchBroker` reads off siegelense's `instanceStartBroker` before it
 * maps the subset onto `QuestWorkInstance` — a restatement of `instanceManifestContract`'s shape, not that
 * contract itself (the orchestrator cannot import `@dungeonmaster/siegelense`; it is a cycle).
 * `logs.api`/`logs.web` stay the NESTED `{ path, linkPresent }` shape the manifest actually carries
 * — `RepoLocalPath` on siegelense's side — because `laneManifestToWorkItemInstanceTransformer` is
 * what extracts the bare path; parsing straight to a string here would silently accept a manifest
 * that never resolved its repo-local symlink.
 *
 * USAGE:
 * laneManifestReadingContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   baseUrl: 'http://localhost:34173',
 *   home: '/tmp/dm-siege-inst_7f3a9c21',
 *   logs: {
 *     api: { path: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/api-server.log', linkPresent: true },
 *     web: { path: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/web-server.log', linkPresent: true },
 *   },
 * });
 * // Returns a validated LaneManifestReading
 */

import { z } from 'zod';

import { absoluteFilePathContract, siegeInstanceIdContract } from '@dungeonmaster/shared/contracts';

const laneManifestLogEntry = z.object({
  path: absoluteFilePathContract,
  linkPresent: z.boolean(),
});

export const laneManifestReadingContract = z.object({
  instanceId: siegeInstanceIdContract,
  baseUrl: z.string().min(1).brand<'InstanceBaseUrl'>().nullable(),
  // `instanceStartBroker` never sets this field on its returned manifest today, so it arrives as
  // `undefined` rather than an explicit `null` — `.optional()`, not `.nullable()`.
  apiUrl: z.string().min(1).brand<'InstanceApiUrl'>().optional(),
  home: absoluteFilePathContract,
  logs: z.object({ api: laneManifestLogEntry, web: laneManifestLogEntry }),
});

export type LaneManifestReading = z.infer<typeof laneManifestReadingContract>;
