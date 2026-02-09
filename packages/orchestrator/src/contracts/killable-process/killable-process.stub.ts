import type { StubArgument } from '@dungeonmaster/shared/@types';

import { killableProcessContract } from './killable-process-contract';
import type { KillableProcess } from './killable-process-contract';

export const KillableProcessStub = ({
  ...props
}: StubArgument<KillableProcess> = {}): KillableProcess => {
  const { kill, waitForExit, ...dataProps } = props;

  return {
    ...killableProcessContract.parse({
      kill: () => true,
      waitForExit: async () => Promise.resolve(),
      ...dataProps,
    }),
    kill: kill ?? (() => true),
    waitForExit: waitForExit ?? (async () => Promise.resolve()),
  };
};
