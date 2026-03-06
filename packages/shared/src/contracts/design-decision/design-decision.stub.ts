import type { StubArgument } from '@dungeonmaster/shared/@types';

import { designDecisionContract } from './design-decision-contract';
import type { DesignDecision } from './design-decision-contract';

export const DesignDecisionStub = ({
  ...props
}: StubArgument<DesignDecision> = {}): DesignDecision =>
  designDecisionContract.parse({
    id: 'use-jwt-auth',
    title: 'Use JWT for authentication tokens',
    rationale: 'JWT allows stateless auth with built-in expiration',
    relatedNodeIds: [],
    ...props,
  });
