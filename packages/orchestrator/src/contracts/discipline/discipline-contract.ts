/**
 * PURPOSE: A discipline names which side of the work a session is responsible for —
 * implementation, reproducing a bug, verifying below the browser, verifying through the
 * browser, or manually QAing the result. The same three phase prompts (planner, worker,
 * reviewer) are parameterized by this value rather than duplicated once per orchestrator role.
 *
 * USAGE:
 * disciplineContract.parse('implementation');
 * // Returns: 'implementation' as Discipline
 */

import { z } from 'zod';

export const disciplineContract = z.enum([
  'implementation',
  'bug-repro',
  'below-browser',
  'browser-e2e',
  'manual-qa',
]);

export type Discipline = z.infer<typeof disciplineContract>;
