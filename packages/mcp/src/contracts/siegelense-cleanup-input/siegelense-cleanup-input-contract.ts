/**
 * PURPOSE: Validates input for the `siegelense-cleanup` MCP tool — always `{}`. `.strict()` on an
 * empty shape rejects any key at all, since cleanup takes no argument: it reaps every stale instance
 * the registry holds and releases the boot/registry lock, never one instance a caller names, and it
 * ages no asset (chunk-03-read-path-and-perception.md §3.E).
 *
 * USAGE:
 * siegelenseCleanupInputContract.parse({});
 * // Returns SiegelenseCleanupInput ({})
 */

import { z } from 'zod';

export const siegelenseCleanupInputContract = z.object({}).strict();

export type SiegelenseCleanupInput = z.infer<typeof siegelenseCleanupInputContract>;
