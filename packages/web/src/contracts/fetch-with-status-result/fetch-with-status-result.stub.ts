import type { StubArgument } from '@dungeonmaster/shared/@types';

import { fetchWithStatusResultContract } from './fetch-with-status-result-contract';
import type { FetchWithStatusResult } from './fetch-with-status-result-contract';

export const FetchWithStatusResultStub = ({
  ...props
}: StubArgument<FetchWithStatusResult> = {}): FetchWithStatusResult =>
  fetchWithStatusResultContract.parse({
    status: 200,
    ok: true,
    body: {},
    ...props,
  });
