import type { StubArgument } from '@dungeonmaster/shared/@types';
import { hydrationRoutesContract } from './hydration-routes-contract';
import type { HydrationRoutes } from './hydration-routes-contract';

export const HydrationRoutesStub = ({
  ...props
}: StubArgument<HydrationRoutes> = {}): HydrationRoutes =>
  hydrationRoutesContract.parse({
    write: (): unknown => undefined,
    ...props,
  });
