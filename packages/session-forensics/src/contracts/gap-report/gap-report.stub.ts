import { gapReportContract, type GapReport } from './gap-report-contract';
import { TurnGapStub } from '../turn-gap/turn-gap.stub';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const GapReportStub = ({ ...props }: StubArgument<GapReport> = {}): GapReport =>
  gapReportContract.parse({
    gaps: [TurnGapStub()],
    wallClockSeconds: 300,
    blockedSeconds: 0,
    idleSeconds: 180,
    ...props,
  });
