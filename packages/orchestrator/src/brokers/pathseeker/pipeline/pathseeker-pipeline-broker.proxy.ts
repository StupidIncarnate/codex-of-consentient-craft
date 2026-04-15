/**
 * PURPOSE: Proxy for pathseeker-pipeline-broker that mocks quest load and spawn dependencies
 *
 * USAGE:
 * const proxy = pathseekerPipelineBrokerProxy();
 * proxy.setupQuestStatus({ quest });
 */

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const pathseekerPipelineBrokerProxy = (): {
  setupQuestStatus: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupSpawnSuccess: () => void;
  getLastSpawnedPrompt: () => unknown;
  onVerifySuccess: jest.Mock;
  onProcessUpdate: jest.Mock;
} => {
  const getProxy = questGetBrokerProxy();
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();

  const onVerifySuccess = jest.fn();
  const onProcessUpdate = jest.fn();

  return {
    setupQuestStatus: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupSpawnSuccess: (): void => {
      spawnProxy.setupSuccess({ exitCode: ExitCodeStub({ value: 0 }) });
    },

    // Reaches into the spawn proxy for the last spawned CLI argv. The Claude
    // adapter places the prompt at argv index 1 (after the `-p` flag).
    getLastSpawnedPrompt: (): unknown => {
      const args = spawnProxy.getSpawnedArgs();
      if (!Array.isArray(args)) return undefined;
      return args[1];
    },

    onVerifySuccess,
    onProcessUpdate,
  };
};
