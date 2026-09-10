import type { StubArgument } from '@dungeonmaster/shared/@types';
import { armedTimerContract } from './armed-timer-contract';
import type { ArmedTimer } from './armed-timer-contract';

export const ArmedTimerStub = ({ ...props }: StubArgument<ArmedTimer> = {}): ArmedTimer => {
  const { isPending, ...dataProps } = props;

  return {
    ...armedTimerContract.parse({
      kind: 'setInterval',
      stack: 'at exampleBroker (packages/testing/src/example-broker.ts:12:3)',
      ...dataProps,
    }),
    isPending: isPending ?? ((): boolean => true),
  };
};
