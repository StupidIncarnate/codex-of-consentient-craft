import type { StubArgument } from '@dungeonmaster/shared/@types';
import { routeFailureContract } from './route-failure-contract';
import type { RouteFailure } from './route-failure-contract';

export const RouteFailureStub = ({ ...props }: StubArgument<RouteFailure> = {}): RouteFailure =>
  routeFailureContract.parse({
    url: null,
    status: null,
    responseBody: null,
    ...props,
  });
