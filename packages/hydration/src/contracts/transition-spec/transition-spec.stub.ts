import type { StubArgument } from '@dungeonmaster/shared/@types';
import { transitionSpecContract } from './transition-spec-contract';
import type { TransitionSpec } from './transition-spec-contract';

export const TransitionSpecStub = ({
  ...props
}: StubArgument<TransitionSpec> = {}): TransitionSpec =>
  transitionSpecContract.parse({
    field: 'status',
    to: ['created', 'approved'],
    reach: (): unknown => undefined,
    ...props,
  });
