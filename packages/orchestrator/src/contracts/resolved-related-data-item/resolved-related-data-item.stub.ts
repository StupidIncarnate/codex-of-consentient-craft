import { DependencyStepStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { resolvedRelatedDataItemContract } from './resolved-related-data-item-contract';
import type { ResolvedItem } from './resolved-related-data-item-contract';

export const ResolvedRelatedDataItemStub = (): ResolvedItem => {
  const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
  const step = DependencyStepStub({ id: stepId });
  return resolvedRelatedDataItemContract.parse({
    collection: 'steps',
    id: stepId,
    item: step,
  });
};
