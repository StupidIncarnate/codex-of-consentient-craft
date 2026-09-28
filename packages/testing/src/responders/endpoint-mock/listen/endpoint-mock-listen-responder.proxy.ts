import { z } from 'zod';

import { mswHttpAdapterProxy } from '../../../adapters/msw/http/msw-http-adapter.proxy';
import { mswServerAdapterProxy } from '../../../adapters/msw/server/msw-server-adapter.proxy';
import type { EndpointResponseContract } from '../../../contracts/endpoint-control/endpoint-control-contract';

export const EndpointMockListenResponderProxy = (): {
  // A stand-in `EndpointResponseContract` for exercising the `contract` param in this file's own
  // test: the test file cannot import zod or any `-contract.ts` file directly (@dungeonmaster/ban-
  // contract-in-tests, @dungeonmaster/enforce-import-dependencies), but a `.proxy.ts` file is
  // exempt from both, same as its existing I/O-mock setup.
  getSampleContract: () => EndpointResponseContract;
} => {
  mswHttpAdapterProxy();
  mswServerAdapterProxy();

  return {
    getSampleContract: (): EndpointResponseContract =>
      z.object({ id: z.string().brand<'SampleId'>() }),
  };
};
