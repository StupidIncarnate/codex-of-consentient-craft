import type { StubArgument } from '@dungeonmaster/shared/@types';

import { planningBlightReportContract } from './planning-blight-report-contract';
import type { PlanningBlightReport } from './planning-blight-report-contract';

export const PlanningBlightReportStub = ({
  ...props
}: StubArgument<PlanningBlightReport> = {}): PlanningBlightReport =>
  planningBlightReportContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    minion: 'security',
    status: 'active',
    findings: [],
    createdAt: '2024-01-15T10:00:00.000Z',
    reviewedOn: [],
    ...props,
  });
