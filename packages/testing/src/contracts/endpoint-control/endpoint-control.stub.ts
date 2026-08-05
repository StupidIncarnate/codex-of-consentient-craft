import type { StubArgument } from '@dungeonmaster/shared/@types';

import { requestCountContract } from '../request-count/request-count-contract';
import { endpointControlContract } from './endpoint-control-contract';
import type { EndpointControl } from './endpoint-control-contract';

export const EndpointControlStub = ({
  ...props
}: StubArgument<EndpointControl> = {}): EndpointControl => {
  const {
    resolves,
    responds,
    respondRaw,
    networkError,
    getRequestCount,
    getRequestBodies,
    ...dataProps
  } = props;

  return {
    ...endpointControlContract.parse({
      ...dataProps,
    }),
    resolves: resolves ?? ((): void => undefined),
    responds: responds ?? ((): void => undefined),
    respondRaw: respondRaw ?? ((): void => undefined),
    networkError: networkError ?? ((): void => undefined),
    getRequestCount:
      getRequestCount ??
      ((): ReturnType<EndpointControl['getRequestCount']> => requestCountContract.parse(0)),
    getRequestBodies:
      getRequestBodies ??
      (async (): ReturnType<EndpointControl['getRequestBodies']> => Promise.resolve([])),
  };
};
