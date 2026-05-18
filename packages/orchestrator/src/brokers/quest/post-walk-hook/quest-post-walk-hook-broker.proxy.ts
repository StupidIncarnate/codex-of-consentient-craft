import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questPostWalkHookBrokerProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupUuidQueue: (params: { uuids: readonly string[] }) => void;
  getAllPersistedContents: () => readonly unknown[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  uuidSpy.mockReturnValue(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479' as ReturnType<typeof crypto.randomUUID>,
  );

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },
    setupUuidQueue: ({ uuids }: { uuids: readonly string[] }): void => {
      for (const id of uuids) {
        uuidSpy.mockReturnValueOnce(id as ReturnType<typeof crypto.randomUUID>);
      }
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
  };
};
