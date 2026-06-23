/**
 * PURPOSE: Proxy for quest-modify-or-throw-broker. Delegates to questModifyBrokerProxy so a caller
 * can stage a real passing persist (setupQuestFound), a resolved success without I/O (setupSuccess),
 * or a resolved { success: false } persist that makes the wrapper throw (setupFailure), and read the
 * captured writes (getAllPersistedContents).
 *
 * USAGE:
 * const proxy = questModifyOrThrowBrokerProxy();
 * proxy.setupFailure(); // the next questModifyBroker call resolves success:false => wrapper throws
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questModifyOrThrowBrokerProxy = (): {
  setupSuccess: () => void;
  setupFailure: () => void;
  setupQuestFound: (params: { quest: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
} => {
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupSuccess: (): void => {
      modifyProxy.setupResolveSuccessOnce();
    },
    setupFailure: (): void => {
      modifyProxy.setupResolveFailureOnce();
    },
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
  };
};
