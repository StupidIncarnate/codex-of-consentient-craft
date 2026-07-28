import { ModifyQuestResultStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const CommentBatchResponderProxy = (): {
  setupUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupPersistSucceeds: () => void;
  setupPersistFails: (params: { error: string }) => void;
  setupQuestFlows: (params: { flows: Quest['flows'] }) => void;
  setupQuestReadFails: () => void;
  getPersistedInputs: () => readonly unknown[];
} => {
  const modifyProxy = questModifyBrokerProxy();
  const getProxy = questGetBrokerProxy();
  // Shares the SAME staged jest.fn as modifyProxy's own handle (registerMock addresses by the
  // function reference) — this handle only exists so setupPersistFails can stage a caller-chosen
  // error text, which modifyProxy's own setupResolveFailureOnce() does not parameterize.
  const modifyHandle = registerMock({ fn: questModifyBroker });
  // The minted comment id. Passthrough so a test that doesn't care about the id still gets a real
  // (if unpredictable) uuid; setupUuids queues deterministic ones for assertion.
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID', passthrough: true });
  // The fallback createdAt for an entry that omits its own — sticky, no test in this responder's
  // suite needs more than one distinct value per run.
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  return {
    setupUuids: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const id of ids) {
        uuidSpy.onceFor([]).returns(id);
      }
    },

    setupPersistSucceeds: (): void => {
      modifyProxy.setupResolveSuccessOnce();
    },

    setupPersistFails: ({ error }: { error: string }): void => {
      modifyHandle
        .onceFor([])
        .resolves(ModifyQuestResultStub({ success: false, error: error as never }));
    },

    setupQuestFlows: ({ flows }: { flows: Quest['flows'] }): void => {
      getProxy.setupQuestFound({ quest: QuestStub({ flows }) });
    },

    setupQuestReadFails: (): void => {
      getProxy.setupEmptyFolder();
    },

    getPersistedInputs: (): readonly unknown[] => modifyProxy.getCallInputs(),
  };
};
