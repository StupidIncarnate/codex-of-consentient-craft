import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  fetchGetWithStatusResultContract,
  type FetchGetWithStatusResult,
} from './fetch-get-with-status-result-contract';

export const FetchGetWithStatusResultStub = ({
  ...props
}: StubArgument<FetchGetWithStatusResult> = {}): FetchGetWithStatusResult =>
  fetchGetWithStatusResultContract.parse({
    status: 200,
    ok: true,
    body: null,
    ...props,
  });
