import { designDecisionIdContract } from './design-decision-id-contract';
import type { DesignDecisionId } from './design-decision-id-contract';

export const DesignDecisionIdStub = (
  { value }: { value: string } = { value: 'use-jwt-auth' },
): DesignDecisionId => designDecisionIdContract.parse(value);
