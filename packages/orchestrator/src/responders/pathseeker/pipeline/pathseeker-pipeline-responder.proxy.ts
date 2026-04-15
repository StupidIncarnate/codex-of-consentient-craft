import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { pathseekerPipelineBrokerProxy } from '../../../brokers/pathseeker/pipeline/pathseeker-pipeline-broker.proxy';
import { PathseekerPipelineResponder } from './pathseeker-pipeline-responder';

type Quest = ReturnType<typeof QuestStub>;

export const PathseekerPipelineResponderProxy = (): {
  callResponder: typeof PathseekerPipelineResponder;
  setupQuestStatus: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupSpawnSuccess: () => void;
  onVerifySuccess: jest.Mock;
  onProcessUpdate: jest.Mock;
} => {
  const brokerProxy = pathseekerPipelineBrokerProxy();

  return {
    callResponder: PathseekerPipelineResponder,

    setupQuestStatus: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuestStatus({ quest });
    },

    setupQuestNotFound: (): void => {
      brokerProxy.setupQuestNotFound();
    },

    setupSpawnSuccess: (): void => {
      brokerProxy.setupSpawnSuccess();
    },

    onVerifySuccess: brokerProxy.onVerifySuccess,
    onProcessUpdate: brokerProxy.onProcessUpdate,
  };
};
