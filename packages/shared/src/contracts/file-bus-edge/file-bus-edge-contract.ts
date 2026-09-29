/**
 * PURPOSE: Defines the FileBusEdge structure linking a file-write caller (`appendFile` or
 * `writeFile` from `#gateway/node/fs__promises`) with a file-tail caller (`tailFile` from
 * `#gateway/node/fs`) on the same literal path or computed path reference.
 *
 * USAGE:
 * fileBusEdgeContract.parse({
 *   filePath: '/repo/.dungeonmaster/quests/quest.jsonl',
 *   writerFile: '/repo/packages/orchestrator/src/brokers/chat/chat-broker.ts',
 *   watcherFile: '/repo/packages/server/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts',
 *   paired: true,
 * });
 * // Returns validated FileBusEdge
 *
 * WHEN-TO-USE: Building the file-bus-edges layer for the project-map EDGES footer
 */

import { z } from '#gateway/npm/zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const fileBusEdgeContract = z.object({
  filePath: contentTextContract,
  writerFile: absoluteFilePathContract.nullable(),
  watcherFile: absoluteFilePathContract.nullable(),
  paired: z.boolean(),
});

export type FileBusEdge = z.infer<typeof fileBusEdgeContract>;
