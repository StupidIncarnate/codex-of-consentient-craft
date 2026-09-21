/**
 * PURPOSE: The shape both graph levels satisfy — the family graph (`questFlowStatics`) and each of
 * the six step graphs (`agentFlowStatics`) — so `graphReachabilityViolationsTransformer` walks
 * either level with the same code. A caller builds one of these by `.parse()`-ing the raw statics
 * object (extra fields such as `role`, `text` or `kind` are stripped, since this schema validates
 * only what the walk reads).
 *
 * USAGE:
 * routedGraphContract.parse({
 *   graphName: 'codeweaver',
 *   entry: 'plan',
 *   nodes: { plan: { routes: { done: 'work' } } },
 * });
 * // Returns a validated RoutedGraph
 */
import { z } from 'zod';

import { routedGraphNodeKeyContract } from '../routed-graph-node-key/routed-graph-node-key-contract';

const routedGraphNodeContract = z.object({
  // DELIBERATELY z.record(z.string()) and NOT the four outcome words. Rule 5 exists to catch
  // `pass:` / `green:` / `rework:`. Narrow this to the union and the bad key is refused before
  // the check runs, so rule 5 could only ever fire on a fixture — never on a real graph.
  routes: z.record(routedGraphNodeKeyContract),
  maxVisits: z.number().int().positive().brand<'RoutedGraphMaxVisits'>().optional(),
  prompt: z.string().brand<'RoutedGraphPromptName'>().optional(),
  handler: z.string().brand<'RoutedGraphHandlerName'>().optional(),
  mintableOnRequest: z.literal(true).optional(),
  appendedAtMerge: z.literal(true).optional(),
});

export const routedGraphContract = z.object({
  graphName: z.string().min(1).brand<'RoutedGraphName'>(),
  entry: routedGraphNodeKeyContract,
  nodes: z.record(routedGraphNodeContract),
});

export type RoutedGraph = z.infer<typeof routedGraphContract>;
export type RoutedGraphNode = z.infer<typeof routedGraphNodeContract>;
