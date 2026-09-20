/**
 * PURPOSE: One route per ingredient name, exactly as the pre-flight ACCEPTED the plan on. Reach for
 * this over asking `routeSelectTransformer` a second time mid-walk: the route a plan was accepted
 * on and the route it actually runs on must be one answer, computed once, not two implementations
 * of the same rule that could silently disagree.
 *
 * USAGE:
 * routePlanContract.parse({ guild: 'write', quest: 'api' });
 * // Returns a RoutePlan
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';
import { hydrationRouteContract } from '../hydration-route/hydration-route-contract';

export const routePlanContract = z.record(ingredientNameContract, hydrationRouteContract);

export type RoutePlan = z.infer<typeof routePlanContract>;
