import { z } from '#gateway/npm/zod';

import { mswServerStateProxy } from '../../../state/msw-server/msw-server-state.proxy';
import type { EndpointResponseContract } from '../../../contracts/endpoint-control/endpoint-control-contract';

export const EndpointMockListenResponderProxy = (): {
  // A stand-in `EndpointResponseContract` for exercising the `contract` param in this file's own
  // test: the test file cannot import zod or any `-contract.ts` file directly (@dungeonmaster/ban-
  // contract-in-tests, @dungeonmaster/enforce-import-dependencies), but a `.proxy.ts` file is
  // exempt from both, same as its existing I/O-mock setup.
  getSampleContract: () => EndpointResponseContract;
} => {
  mswServerStateProxy();

  return {
    getSampleContract: (): EndpointResponseContract =>
      z.object({ id: z.string().brand<'SampleId'>() }),
  };
};
