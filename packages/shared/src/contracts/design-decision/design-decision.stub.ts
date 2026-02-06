import type { StubArgument } from '@dungeonmaster/shared/@types';

import { designDecisionContract } from './design-decision-contract';
import type { DesignDecision } from './design-decision-contract';

export const DesignDecisionStub = ({
  ...props
}: StubArgument<DesignDecision> = {}): DesignDecision =>
  designDecisionContract.parse({
    id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Use JWT for authentication tokens',
    rationale: 'JWT allows stateless auth with built-in expiration',
    relatedRequirements: [],
    ...props,
  });
