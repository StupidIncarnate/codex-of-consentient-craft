import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { AgyPreToolDecision } from './agy-pre-tool-decision-contract';
import { agyPreToolDecisionContract } from './agy-pre-tool-decision-contract';

export const AgyPreToolDecisionStub = ({
  ...props
}: StubArgument<AgyPreToolDecision> = {}): AgyPreToolDecision =>
  agyPreToolDecisionContract.parse({
    decision: 'allow',
    ...props,
  });
