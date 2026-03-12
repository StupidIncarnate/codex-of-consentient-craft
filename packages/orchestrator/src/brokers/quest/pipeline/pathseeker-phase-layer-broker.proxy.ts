import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const pathseekerPhaseLayerBrokerProxy = (): {
  setupSpawnSuccess: () => void;
  setupSpawnSuccessWithLines: (params: { lines: readonly string[] }) => void;
  setupSpawnFailure: () => void;
} => {
  const spawnProxy = agentSpawnByRoleBrokerProxy();

  return {
    setupSpawnSuccess: (): void => {
      spawnProxy.setupSpawnOnce({ lines: [], exitCode: ExitCodeStub({ value: 0 }) });
    },
    setupSpawnSuccessWithLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.setupSpawnOnce({ lines, exitCode: ExitCodeStub({ value: 0 }) });
    },
    setupSpawnFailure: (): void => {
      spawnProxy.setupSpawnOnce({ lines: [], exitCode: ExitCodeStub({ value: 1 }) });
    },
  };
};
