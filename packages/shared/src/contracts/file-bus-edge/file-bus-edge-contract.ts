/**
 * PURPOSE: Defines the FileBusEdge structure linking a file-write adapter caller
 * (fsAppendFileAdapter or fsWriteFileAdapter) with a file-watcher caller
 * (fsWatchTailAdapter) on the same literal path or computed broker reference.
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

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const fileBusEdgeContract = z.object({
  filePath: contentTextContract,
  writerFile: absoluteFilePathContract.nullable(),
  watcherFile: absoluteFilePathContract.nullable(),
  paired: z.boolean(),
});

export type FileBusEdge = z.infer<typeof fileBusEdgeContract>;
