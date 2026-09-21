/**
 * PURPOSE: A key into a routed graph's `nodes` — a step name inside a step graph, or a family
 * name inside the family graph. `Object.entries`/`Object.keys` erase branding on an object's own
 * keys, so `graphReachabilityViolationsTransformer` re-parses each raw string key through this
 * contract once per graph, and every lookup afterward compares like with like.
 *
 * USAGE:
 * routedGraphNodeKeyContract.parse('plan');
 * // Returns a branded RoutedGraphNodeKey
 */
import { z } from 'zod';

export const routedGraphNodeKeyContract = z.string().min(1).brand<'RoutedGraphNodeKey'>();

export type RoutedGraphNodeKey = z.infer<typeof routedGraphNodeKeyContract>;
