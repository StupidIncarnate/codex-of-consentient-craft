/**
 * PURPOSE: Stub factory for FileBusEdge contract
 *
 * USAGE:
 * const edge = FileBusEdgeStub({ filePath: '/repo/.dungeonmaster/quests/quest.jsonl', paired: true });
 * // Returns a validated FileBusEdge with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { fileBusEdgeContract, type FileBusEdge } from './file-bus-edge-contract';

export const FileBusEdgeStub = ({ ...props }: StubArgument<FileBusEdge> = {}): FileBusEdge =>
  fileBusEdgeContract.parse({
    filePath: '/repo/.dungeonmaster/quests/quest.jsonl',
    writerFile: '/repo/packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts',
    watcherFile: '/repo/packages/server/src/brokers/quest/outbox-watch/quest-outbox-watch-broker.ts',
    paired: true,
    ...props,
  });
