/**
 * PURPOSE: The program ward starts a Node-based test runner (jest, Playwright) through, and the
 * arguments that come before the runner's own. Lint and typecheck spawn their bin directly and
 * have no use for this.
 *
 * USAGE:
 * runnerCommandContract.parse({ command: '/usr/bin/node', leadingArgs: ['--conditions=source', '/repo/node_modules/.bin/jest'] });
 * // Returns: RunnerCommand validated object
 */

import { z } from '#gateway/npm/zod';

export const runnerCommandContract = z
  .object({
    command: z.string().min(1).brand<'RunnerCommandCommand'>(),
    leadingArgs: z.array(z.string().min(1).brand<'RunnerCommandLeadingArgs'>()),
  })
  .brand<'RunnerCommand'>();

export type RunnerCommand = z.infer<typeof runnerCommandContract>;
