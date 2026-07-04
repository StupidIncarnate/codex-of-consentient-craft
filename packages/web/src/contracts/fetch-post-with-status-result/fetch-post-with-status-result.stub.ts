import type { StubArgument } from '@dungeonmaster/shared/@types';

import { fetchPostWithStatusResultContract } from './fetch-post-with-status-result-contract';
import type { FetchPostWithStatusResult } from './fetch-post-with-status-result-contract';

export const FetchPostWithStatusResultStub = ({
  ...props
}: StubArgument<FetchPostWithStatusResult> = {}): FetchPostWithStatusResult =>
  fetchPostWithStatusResultContract.parse({
    status: 200,
    ok: true,
    body: {},
    ...props,
  });
