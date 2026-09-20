/**
 * PURPOSE: Branded string for a Claude `tool_use` id — the Task-dispatch id that correlates an
 * assistant's Task/Agent tool_use entry to the sub-agent it spawned. `@dungeonmaster/orchestrator`
 * defines the identical shape at `src/contracts/tool-use-id/tool-use-id-contract.ts`, but its public
 * barrel (`src/index.ts`) does not re-export it, so this package has no allowed import path to it.
 * Reach for THIS contract on every subagent field or record carrying a `toolUseId` rather than
 * inlining the brand a second time at each call site.
 *
 * USAGE:
 * toolUseIdContract.parse('toolu_01EaCJyt5y8gzMNyGYarwUDZ');
 * // Returns branded ToolUseId
 */
import { z } from 'zod';

export const toolUseIdContract = z.string().min(1).brand<'ToolUseId'>();

export type ToolUseId = z.infer<typeof toolUseIdContract>;
