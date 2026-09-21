/**
 * PURPOSE: The lane manifest a `needsLane` work item carries once the router has started its
 * instance — field names copied verbatim from siegelense's own `instanceManifestContract`, so the
 * router records across without a rename. The orchestrator cannot depend on
 * `@dungeonmaster/siegelense` (it is a cycle), so this is the deliberate restatement of the subset
 * a walker and its prompt use. Both the writer (the router, at dispatch) and the reader
 * (`get-quest-work`'s `instance` row, `workItemToPromptTransformer`'s instance-id line) parse
 * through this ONE shape, so a field added on one side is never silently absent on the other.
 *
 * `baseUrl` STAYS NULLABLE: a browserless spec binds no web port, so `null` means "this spec never
 * claimed a web surface", never "the surface failed to come up" — that failure is a thrown
 * `LaneBootFailedError` at `start` time and never reaches this shape at all.
 *
 * USAGE:
 * questWorkInstanceContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   baseUrl: 'http://localhost:34173',
 *   apiUrl: null,
 *   home: '/tmp/dm-siege-inst_7f3a9c21',
 *   logs: { api: '/repo/.siegelense/g1/instances/inst_7f3a9c21/api-server.log', web: '/repo/.siegelense/g1/instances/inst_7f3a9c21/web-server.log' },
 * });
 * // Returns a validated QuestWorkInstance
 */

import { z } from 'zod';

import {
  absoluteFilePathContract,
  filePathContract,
  siegeInstanceIdContract,
} from '@dungeonmaster/shared/contracts';

export const questWorkInstanceContract = z.object({
  instanceId: siegeInstanceIdContract,
  baseUrl: z.string().min(1).brand<'InstanceBaseUrl'>().nullable(),
  apiUrl: z.string().min(1).brand<'InstanceApiUrl'>().nullable(),
  home: absoluteFilePathContract,
  logs: z.object({ api: filePathContract, web: filePathContract }),
});

export type QuestWorkInstance = z.infer<typeof questWorkInstanceContract>;
