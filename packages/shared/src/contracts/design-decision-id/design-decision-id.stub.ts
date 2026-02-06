import { designDecisionIdContract } from './design-decision-id-contract';
import type { DesignDecisionId } from './design-decision-id-contract';

export const DesignDecisionIdStub = (
  { value }: { value: string } = { value: 'c23bc10b-58cc-4372-a567-0e02b2c3d479' },
): DesignDecisionId => designDecisionIdContract.parse(value);
