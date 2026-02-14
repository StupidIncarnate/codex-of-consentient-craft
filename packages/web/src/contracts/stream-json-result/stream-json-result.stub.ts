import type { StubArgument } from '@dungeonmaster/shared/@types';

import { streamJsonResultContract } from './stream-json-result-contract';
import type { StreamJsonResult } from './stream-json-result-contract';

export const StreamJsonResultStub = ({
  ...props
}: StubArgument<StreamJsonResult> = {}): StreamJsonResult =>
  streamJsonResultContract.parse({
    entries: [],
    sessionId: null,
    ...props,
  });
