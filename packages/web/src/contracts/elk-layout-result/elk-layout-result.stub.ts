/**
 * PURPOSE: Builds a valid ElkLayoutResult for tests
 *
 * USAGE:
 * ElkLayoutResultStub();
 * // Returns a valid ElkLayoutResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ElkPositionMapStub } from '../elk-position-map/elk-position-map.stub';
import { FlowEdgeRouteMapStub } from '../flow-edge-route-map/flow-edge-route-map.stub';

import { elkLayoutResultContract } from './elk-layout-result-contract';
import type { ElkLayoutResult } from './elk-layout-result-contract';

export const ElkLayoutResultStub = ({
  ...props
}: StubArgument<ElkLayoutResult> = {}): ElkLayoutResult =>
  elkLayoutResultContract.parse({
    positions: ElkPositionMapStub(),
    routes: FlowEdgeRouteMapStub(),
    ...props,
  });
