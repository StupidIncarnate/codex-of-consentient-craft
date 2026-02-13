/**
 * PURPOSE: Proxy for pathseeker-pipeline-broker that mocks verification and spawn dependencies
 *
 * USAGE:
 * const proxy = pathseekerPipelineBrokerProxy();
 * proxy.setupVerifySuccess({ quest });
 */

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { questVerifyBrokerProxy } from '../../quest/verify/quest-verify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const pathseekerPipelineBrokerProxy = (): {
  setupVerifySuccess: (params: { quest: Quest }) => void;
  setupVerifyFailure: () => void;
  setupSpawnSuccess: () => void;
  onVerifySuccess: jest.Mock;
  onProcessUpdate: jest.Mock;
} => {
  const verifyProxy = questVerifyBrokerProxy();
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();

  const onVerifySuccess = jest.fn();
  const onProcessUpdate = jest.fn();

  return {
    setupVerifySuccess: ({ quest }: { quest: Quest }): void => {
      verifyProxy.setupQuestFound({ quest });
    },

    setupVerifyFailure: (): void => {
      verifyProxy.setupEmptyFolder();
    },

    setupSpawnSuccess: (): void => {
      spawnProxy.setupSuccess({ exitCode: ExitCodeStub({ value: 0 }) });
    },

    onVerifySuccess,
    onProcessUpdate,
  };
};
