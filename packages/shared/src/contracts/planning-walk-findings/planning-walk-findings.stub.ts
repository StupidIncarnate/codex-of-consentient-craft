import type { StubArgument } from '@dungeonmaster/shared/@types';

import { planningWalkFindingsContract } from './planning-walk-findings-contract';
import type { PlanningWalkFindings } from './planning-walk-findings-contract';

export const PlanningWalkFindingsStub = ({
  ...props
}: StubArgument<PlanningWalkFindings> = {}): PlanningWalkFindings =>
  planningWalkFindingsContract.parse({
    filesRead: [],
    structuralIssuesFound: [],
    planPatches: [],
    verifiedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
