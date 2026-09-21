/**
 * PURPOSE: Runs the reachability check on the family graph and every step graph at HTTP server
 * boot, letting a violation's throw reach `StartServer` directly — a bad graph stops the boot
 * rather than stalling a quest with no error later. Deliberately NOT `.bootstrap()`-shaped:
 * `OrchestrationBootFlow.bootstrap()` catches its own failure and writes it to stderr, and a
 * swallowed graph failure is exactly the silent stall this check exists to prevent.
 *
 * USAGE:
 * GraphReachabilityBootFlow();
 * // Throws when the family graph or any step graph carries a reachability violation; otherwise
 * // returns { success: true }
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { GraphReachabilityCheckResponder } from '../../responders/graph-reachability/check/graph-reachability-check-responder';

export const GraphReachabilityBootFlow = (): AdapterResult => GraphReachabilityCheckResponder();
