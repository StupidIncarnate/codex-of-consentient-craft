import { fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { questPersistDirectBrokerProxy } from '../persist-direct/quest-persist-direct-broker.proxy';

const FIXED_QUEST_ID = questIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
const FIXED_TIMESTAMP = questContract.shape.createdAt.parse('2024-01-15T10:00:00.000Z');

export const questWriteRouteBrokerProxy = (): {
  succeeds: ({ questFilePath, outboxPath }: { questFilePath: string; outboxPath: string }) => void;
  mintedQuestId: QuestId;
  mintedCreatedAt: typeof FIXED_TIMESTAMP;
} => {
  // fsMkdirAdapterProxy's own default (any unaddressed call succeeds) is all this route needs.
  fsMkdirAdapterProxy();
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
  };
};
