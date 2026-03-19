import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  playwrightLineResultsContract,
  type PlaywrightLineResults,
} from './playwright-line-results-contract';

export const PlaywrightLineResultsStub = ({
  ...props
}: StubArgument<PlaywrightLineResults> = {}): PlaywrightLineResults =>
  playwrightLineResultsContract.parse({
    passed: [],
    failed: [],
    total: 0,
    ...props,
  });
