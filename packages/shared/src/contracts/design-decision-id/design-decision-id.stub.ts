import type { DesignDecision } from '../design-decision/design-decision-contract';
import { designDecisionContract } from '../design-decision/design-decision-contract';

export const DesignDecisionIdStub = (
  { value }: { value: string } = { value: 'use-jwt-auth' },
): DesignDecision['id'] => designDecisionContract.shape.id.parse(value);
