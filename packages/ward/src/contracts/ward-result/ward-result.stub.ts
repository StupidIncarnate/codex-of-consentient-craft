import type { StubArgument } from '@dungeonmaster/shared/@types';
import { wardRunResultContract, type WardRunResult } from './ward-result-contract';

export const WardRunResultStub = ({ ...props }: StubArgument<WardRunResult> = {}): WardRunResult =>
  wardRunResultContract.parse({
    runId: '1739625600000-a3f1',
    timestamp: 1739625600000,
    filters: {},
    checks: [],
    ...props,
  });
