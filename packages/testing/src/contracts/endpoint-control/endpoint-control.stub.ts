import type { StubArgument } from '@dungeonmaster/shared/@types';

import { endpointControlContract } from './endpoint-control-contract';
import type { EndpointControl } from './endpoint-control-contract';

export const EndpointControlStub = ({
  ...props
}: StubArgument<EndpointControl> = {}): EndpointControl => {
  const { resolves, responds, respondRaw, networkError, ...dataProps } = props;

  return {
    ...endpointControlContract.parse({
      ...dataProps,
    }),
    resolves: resolves ?? ((): void => undefined),
    responds: responds ?? ((): void => undefined),
    respondRaw: respondRaw ?? ((): void => undefined),
    networkError: networkError ?? ((): void => undefined),
  };
};
