import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationProcessContract } from './orchestration-process-contract';
import type { OrchestrationProcess } from './orchestration-process-contract';
import type { KillableProcess } from '../killable-process/killable-process-contract';

const createDefaultProcess = (): KillableProcess => ({
  kill: () => true,
  waitForExit: async () => Promise.resolve(),
});

export const OrchestrationProcessStub = ({
  ...props
}: StubArgument<OrchestrationProcess> = {}): OrchestrationProcess => {
  const { process: processFromProps, ...dataProps } = props;

  const defaultProcess = createDefaultProcess();

  const processValue: KillableProcess =
    processFromProps === undefined
      ? defaultProcess
      : {
          kill: processFromProps.kill ?? (() => true),
          waitForExit: processFromProps.waitForExit ?? (async () => Promise.resolve()),
        };

  return {
    ...orchestrationProcessContract.parse({
      processId: 'proc-12345',
      questId: 'add-auth',
      process: defaultProcess,
      phase: 'idle',
      completedSteps: 0,
      totalSteps: 5,
      startedAt: '2024-01-15T10:00:00.000Z',
      slots: [],
      ...dataProps,
    }),
    process: processValue,
  };
};
