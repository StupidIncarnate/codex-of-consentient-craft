/**
 * PURPOSE: Defines how the orchestrator launches a work item
 *
 * USAGE:
 * spawnerTypeContract.parse('agent');
 * // Returns: 'agent' as SpawnerType
 */

import { z } from 'zod';

export const spawnerTypeContract = z.enum(['agent', 'command']);

export type SpawnerType = z.infer<typeof spawnerTypeContract>;
