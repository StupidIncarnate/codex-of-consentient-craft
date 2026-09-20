/**
 * PURPOSE: The three severities a `results` query's `where: { level }` filters a `server` or
 * `console` row by — `error`, `warn`, `info` — a caller-facing filter value, never the raw
 * `runIndexComputeTransformer` pattern match that classifies a line as one of them in the first
 * place. Reach for this over a raw string whenever the value narrows a query rather than
 * classifies a buffered line.
 *
 * USAGE:
 * logLevelContract.parse('error');
 * // Returns a branded LogLevel
 */

import { z } from 'zod';

export const logLevelContract = z.enum(['error', 'warn', 'info']).brand<'LogLevel'>();

export type LogLevel = z.infer<typeof logLevelContract>;
