import type { StubArgument } from '@dungeonmaster/shared/@types';

import { planningReviewReportContract } from './planning-review-report-contract';
import type { PlanningReviewReport } from './planning-review-report-contract';

export const PlanningReviewReportStub = ({
  ...props
}: StubArgument<PlanningReviewReport> = {}): PlanningReviewReport =>
  planningReviewReportContract.parse({
    signal: 'clean',
    criticalItems: [],
    warnings: [],
    info: [],
    noveltyConcerns: [],
    rawReport: '# Review Report\n\nNo blocking issues.',
    reviewedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
