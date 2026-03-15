import type { StubArgument } from '@dungeonmaster/shared/@types';

import { nextReadyResultContract } from './next-ready-result-contract';
import type { NextReadyResult } from './next-ready-result-contract';

export const NextReadyResultStub = ({
  ...props
}: StubArgument<NextReadyResult> = {}): NextReadyResult =>
  nextReadyResultContract.parse({
    ready: [],
    questTerminal: false,
    questBlocked: false,
    ...props,
  });
