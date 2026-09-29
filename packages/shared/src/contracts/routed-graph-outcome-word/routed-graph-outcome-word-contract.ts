/**
 * PURPOSE: A key into a routed graph node's `routes` — deliberately a bare branded string and NOT
 * the closed four-word union (`done`/`unmet`/`empty`/`wall`), so a bad key a fixture writes (e.g.
 * `pass:`, `green:`, `rework:`) is caught by the graph's own reachability check rather than refused
 * by the schema before that check ever runs. A caller reading a known outcome (e.g. `'done'`)
 * re-parses it through this contract to index the branded `Record` `routedGraphContract`'s `routes`
 * field returns.
 *
 * USAGE:
 * routedGraphOutcomeWordContract.parse('done');
 * // Returns a branded RoutedGraphOutcomeWord
 */
import { z } from '#gateway/npm/zod';

export const routedGraphOutcomeWordContract = z.string().brand<'RoutedGraphOutcomeWord'>();

export type RoutedGraphOutcomeWord = z.infer<typeof routedGraphOutcomeWordContract>;
