import { hydrationRouteContract } from './hydration-route-contract';
import type { HydrationRoute } from './hydration-route-contract';

export const HydrationRouteStub = (
  { value }: { value: string } = { value: 'api' },
): HydrationRoute => hydrationRouteContract.parse(value);
