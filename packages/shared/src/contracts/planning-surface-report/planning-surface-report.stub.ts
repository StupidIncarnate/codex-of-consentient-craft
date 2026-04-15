import type { StubArgument } from '@dungeonmaster/shared/@types';

import { planningSurfaceReportContract } from './planning-surface-report-contract';
import type { PlanningSurfaceReport } from './planning-surface-report-contract';

export const PlanningSurfaceReportStub = ({
  ...props
}: StubArgument<PlanningSurfaceReport> = {}): PlanningSurfaceReport =>
  planningSurfaceReportContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    sliceName: 'auth-slice',
    packages: ['@dungeonmaster/shared'],
    flowIds: [],
    observableIds: [],
    rawReport: '# Surface Scope Report\n\nDetails of the slice...',
    submittedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
