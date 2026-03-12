import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationProcessContract } from './orchestration-process-contract';
import type { OrchestrationProcess } from './orchestration-process-contract';

export const OrchestrationProcessStub = ({
  ...props
}: StubArgument<OrchestrationProcess> = {}): OrchestrationProcess => {
  const { kill: killFromProps, ...dataProps } = props;

  return {
    ...orchestrationProcessContract.parse({
      processId: 'proc-12345',
      questId: 'add-auth',
      kill: () => undefined,
      ...dataProps,
    }),
    kill: killFromProps ?? (() => undefined),
  };
};
