import type { StubArgument } from '@dungeonmaster/shared/@types';

import { wardRunResultContract } from './ward-run-result-contract';
import type { WardRunResult } from './ward-run-result-contract';

export const WardRunResultStub = ({ ...props }: StubArgument<WardRunResult> = {}): WardRunResult =>
  wardRunResultContract.parse({
    success: true,
    output: '',
    errors: [],
    ...props,
  });
