import type { StubArgument } from '@dungeonmaster/shared/@types';
import { wardResultContract, type WardResult } from './ward-result-contract';

export const WardResultStub = ({ ...props }: StubArgument<WardResult> = {}): WardResult =>
  wardResultContract.parse({
    runId: '1739625600000-a3f1',
    timestamp: 1739625600000,
    filters: {},
    checks: [],
    ...props,
  });
