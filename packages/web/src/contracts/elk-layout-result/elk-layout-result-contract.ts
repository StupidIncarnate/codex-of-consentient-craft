/**
 * PURPOSE: Defines the data `elkLayoutBroker` returns
 *
 * USAGE:
 * elkLayoutResultContract.parse(value);
 * // Returns validated ElkLayoutResult
 */
import { z } from '#gateway/npm/zod';
import { elkPositionMapContract } from '../elk-position-map/elk-position-map-contract';
import { flowEdgeRouteMapContract } from '../flow-edge-route-map/flow-edge-route-map-contract';

export const elkLayoutResultContract = z
  .object({ positions: elkPositionMapContract, routes: flowEdgeRouteMapContract })
  .brand<'ElkLayoutResult'>();

export type ElkLayoutResult = z.infer<typeof elkLayoutResultContract>;
