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
 *   logs: { api: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/api-server.log', web: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/web-server.log' },
 * });
 * // Returns a validated QuestWorkInstance
 */

import { z } from '#gateway/npm/zod';

import { siegeInstanceContract, relativeFilePathContract } from '@dungeonmaster/shared/contracts';

export const questWorkInstanceContract = z
  .object({
    instanceId: siegeInstanceContract.shape.id,
    baseUrl: z.string().min(1).brand<'QuestWorkInstanceBaseUrl'>().nullable(),
    apiUrl: z.string().min(1).brand<'QuestWorkInstanceApiUrl'>().nullable(),
    home: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return true;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return true;
          }
          return false;
        },
        { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
      )
      .brand<'QuestWorkInstanceHome'>(),
    logs: z
      .object({
        api: z
          .union([
            z
              .string()
              .min(1)
              .refine(
                (path) => {
                  if (path.startsWith('/')) {
                    return true;
                  }
                  if (/^[A-Za-z]:\\/u.test(path)) {
                    return true;
                  }
                  return false;
                },
                { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
              )
              .brand<'QuestWorkInstanceLogsApi'>(),
            relativeFilePathContract,
          ])
          .brand<'QuestWorkInstanceLogsApi'>(),
        web: z
          .union([
            z
              .string()
              .min(1)
              .refine(
                (path) => {
                  if (path.startsWith('/')) {
                    return true;
                  }
                  if (/^[A-Za-z]:\\/u.test(path)) {
                    return true;
                  }
                  return false;
                },
                { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
              )
              .brand<'QuestWorkInstanceLogsWeb'>(),
            relativeFilePathContract,
          ])
          .brand<'QuestWorkInstanceLogsWeb'>(),
      })
      .brand<'QuestWorkInstanceLogs'>(),
  })
  .brand<'QuestWorkInstance'>();

export type QuestWorkInstance = z.infer<typeof questWorkInstanceContract>;
