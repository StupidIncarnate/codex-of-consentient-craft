/**
 * PURPOSE: Names how callerRepoRootResolveBroker resolved a project root — from the caller's own
 * JSONL-scanned cwd, or a fallback to the MCP server's own startup cwd. Carried into every
 * discover/get-project-map/get-project-inventory response so a caller can see (not guess) which
 * tree an answer came from, and so a fallback is a visible label rather than a silent identical
 * shape to the success case.
 *
 * USAGE:
 * callerRepoRootSourceContract.parse('caller-cwd');
 * // Returns branded CallerRepoRootSource
 */

import { z } from 'zod';

export const callerRepoRootSourceContract = z
  .enum(['caller-cwd', 'server-cwd-fallback'])
  .brand<'CallerRepoRootSource'>();

export type CallerRepoRootSource = z.infer<typeof callerRepoRootSourceContract>;
