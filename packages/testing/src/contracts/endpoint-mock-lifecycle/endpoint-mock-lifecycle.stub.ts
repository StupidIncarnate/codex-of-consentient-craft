import type { StubArgument } from '@dungeonmaster/shared/@types';
import { endpointMockLifecycleContract } from './endpoint-mock-lifecycle-contract';
import type { EndpointMockLifecycle } from './endpoint-mock-lifecycle-contract';

export const EndpointMockLifecycleStub = ({
  ...props
}: StubArgument<EndpointMockLifecycle> = {}): EndpointMockLifecycle => {
  const { listen, resetHandlers, close, ...dataProps } = props;

  return {
    ...endpointMockLifecycleContract.parse({
      ...dataProps,
    }),
    listen: listen ?? ((): void => undefined),
    resetHandlers: resetHandlers ?? ((): void => undefined),
    close: close ?? ((): void => undefined),
  };
};
