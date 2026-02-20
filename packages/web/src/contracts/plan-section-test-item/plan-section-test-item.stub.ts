import type { StubArgument } from '@dungeonmaster/shared/@types';

import { planSectionTestItemContract } from './plan-section-test-item-contract';
import type { PlanSectionTestItem } from './plan-section-test-item-contract';

export const PlanSectionTestItemStub = ({
  ...props
}: StubArgument<PlanSectionTestItem> = {}): PlanSectionTestItem =>
  planSectionTestItemContract.parse({
    text: 'step-a',
    ...props,
  });
