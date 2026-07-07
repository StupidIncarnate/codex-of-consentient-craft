import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowEdgeRouteMapContract } from './flow-edge-route-map-contract';
import type { FlowEdgeRouteMap } from './flow-edge-route-map-contract';

export const FlowEdgeRouteMapStub = (
  { ...props }: StubArgument<FlowEdgeRouteMap> = {
    e1: [
      { x: 0, y: 0 },
      { x: 0, y: 60 },
      { x: 120, y: 60 },
    ],
  },
): FlowEdgeRouteMap => flowEdgeRouteMapContract.parse({ ...props });
