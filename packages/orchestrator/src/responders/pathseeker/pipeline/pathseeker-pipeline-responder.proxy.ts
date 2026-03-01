import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { pathseekerPipelineBrokerProxy } from '../../../brokers/pathseeker/pipeline/pathseeker-pipeline-broker.proxy';
import { PathseekerPipelineResponder } from './pathseeker-pipeline-responder';

type Quest = ReturnType<typeof QuestStub>;

export const PathseekerPipelineResponderProxy = (): {
  callResponder: typeof PathseekerPipelineResponder;
  setupVerifySuccess: (params: { quest: Quest }) => void;
  setupVerifyFailure: () => void;
  setupSpawnSuccess: () => void;
  onVerifySuccess: jest.Mock;
  onProcessUpdate: jest.Mock;
} => {
  const brokerProxy = pathseekerPipelineBrokerProxy();

  return {
    callResponder: PathseekerPipelineResponder,

    setupVerifySuccess: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupVerifySuccess({ quest });
    },

    setupVerifyFailure: (): void => {
      brokerProxy.setupVerifyFailure();
    },

    setupSpawnSuccess: (): void => {
      brokerProxy.setupSpawnSuccess();
    },

    onVerifySuccess: brokerProxy.onVerifySuccess,
    onProcessUpdate: brokerProxy.onProcessUpdate,
  };
};
