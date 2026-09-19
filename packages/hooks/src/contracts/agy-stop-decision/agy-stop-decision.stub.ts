import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { AgyStopDecision } from './agy-stop-decision-contract';
import { agyStopDecisionContract } from './agy-stop-decision-contract';

export const AgyStopDecisionStub = ({
  ...props
}: StubArgument<AgyStopDecision> = {}): AgyStopDecision =>
  agyStopDecisionContract.parse({
    decision: 'stop',
    ...props,
  });
