import type { StubArgument } from '@dungeonmaster/shared/@types';
import { timerHandleContract } from './timer-handle-contract';
import type { TimerHandle } from './timer-handle-contract';

export const TimerHandleStub = ({ ...props }: StubArgument<TimerHandle> = {}): TimerHandle => {
  const { hasRef, ...dataProps } = props;

  return {
    ...timerHandleContract.parse({ ...dataProps }),
    hasRef: hasRef ?? ((): boolean => true),
  };
};
