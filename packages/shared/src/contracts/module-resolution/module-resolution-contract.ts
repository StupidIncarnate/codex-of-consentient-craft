/**
 * PURPOSE: Where a module specifier resolved, and which install answered: the run root's own
 * `node_modules` or this process's own install. Reach for the `resolvedFrom` field when a caller
 * must know whether it got the checkout's copy or the fallback.
 *
 * USAGE:
 * moduleResolutionContract.parse({ path: '/repo/node_modules/@dungeonmaster/cli/package.json', resolvedFrom: 'run-root' });
 * // Returns a ModuleResolution
 */

import { z } from '#gateway/npm/zod';

export const moduleResolutionContract = z
  .object({
    path: z.string().min(1).brand<'ModuleResolutionPath'>(),
    resolvedFrom: z.enum(['run-root', 'own-install']),
  })
  .brand<'ModuleResolution'>();

export type ModuleResolution = z.infer<typeof moduleResolutionContract>;
