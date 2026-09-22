import { fsMkdirAdapterProxy, pathResolveAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { questPersistDirectBrokerProxy } from '../persist-direct/quest-persist-direct-broker.proxy';

const FIXED_QUEST_ID = questIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
const FIXED_TIMESTAMP = questContract.shape.createdAt.parse('2024-01-15T10:00:00.000Z');

export const questWriteRouteBrokerProxy = (): {
  succeeds: ({ questFilePath, outboxPath }: { questFilePath: string; outboxPath: string }) => void;
  pathsTouched: () => readonly unknown[];
  mintedQuestId: QuestId;
  mintedCreatedAt: typeof FIXED_TIMESTAMP;
} => {
  // fsMkdirAdapterProxy's own default (any unaddressed call succeeds) is all this route needs.
  const mkdirProxy = fsMkdirAdapterProxy();
  // pathResolveAdapterProxy's own default is a REAL passthrough, so the route's containment check
  // computes a genuine resolved path with nothing staged.
  pathResolveAdapterProxy();
  const persistProxy = questPersistDirectBrokerProxy();
  registerSpyOn({ object: crypto, method: 'randomUUID' })
    .calledWith([])
    .returns(FIXED_QUEST_ID as never);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

  return {
    mintedQuestId: FIXED_QUEST_ID,
    mintedCreatedAt: FIXED_TIMESTAMP,
    succeeds: ({
      questFilePath,
      outboxPath,
    }: {
      questFilePath: string;
      outboxPath: string;
    }): void => {
      persistProxy.succeeds({ questFilePath, outboxPath });
    },
    // Every filesystem path the route reached, in order: the quest folder it made, the temp file,
    // the quest file it renamed that to, then the outbox. Assert containment against this, never
    // against the addresses `succeeds` staged.
    pathsTouched: (): readonly unknown[] => [
      ...mkdirProxy.getCreatedDirs(),
      ...persistProxy.pathsTouched(),
    ],
  };
};
