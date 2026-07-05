/**
 * PURPOSE: Defines the declared orchestration mode from `.dungeonmaster.json` — `claude` (the user's
 * terminal session owns quest creation via /dumpster-create and the web honors ?chat=hidden) or `node`
 * (the web drives quest creation from a chat message and launches ChaosWhisperer via child_exec).
 *
 * USAGE:
 * orchestrationModeContract.parse('node');
 * // Returns: OrchestrationMode ('claude' | 'node')
 */

import { z } from 'zod';

export const orchestrationModeContract = z.enum(['claude', 'node']);

export type OrchestrationMode = z.infer<typeof orchestrationModeContract>;
