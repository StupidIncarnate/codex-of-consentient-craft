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

export const fileBusEdgeContract = z.object({
  filePath: z.string().brand<'FileBusEdgeFilePath'>(),
  writerFile: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'FileBusEdgeWriterFile'>().nullable(),
  watcherFile: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'FileBusEdgeWatcherFile'>().nullable(),
  paired: z.boolean(),
}).brand<'FileBusEdge'>();

export type FileBusEdge = z.infer<typeof fileBusEdgeContract>;
