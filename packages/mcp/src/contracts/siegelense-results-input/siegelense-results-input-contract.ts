/**
 * PURPOSE: Validates input for the `siegelense-results` MCP tool — the instance to read evidence
 * from, plus every optional narrowing lever `resultsReadBroker` accepts: which run, which step,
 * which kind, a `where` clause, a `fields` projection, and `since: 'boot'`. Every optional field is
 * OMITTED, never sent as an explicit `null`, by a caller with no narrower request; the responder
 * folds an omitted value to `null` before handing it to `resultsQueryContract`, which requires every
 * member explicit. `.strict()` so a typo (`instance` for `instanceId`) is a parse error naming the
 * stray key rather than a query that silently runs against the wrong instance.
 *
 * USAGE:
 * siegelenseResultsInputContract.parse({ instanceId: 'inst_7f3a9c21', kind: 'console' });
 * // Returns SiegelenseResultsInput with runId, step, where, fields and since all absent
 */

import { z } from 'zod';

import {
  instanceIdContract,
  resultFieldContract,
  resultKindContract,
  resultWhereContract,
  runIdContract,
  sinceMarkerContract,
  stepIndexContract,
} from '@dungeonmaster/siegelense/contracts';

export const siegelenseResultsInputContract = z
  .object({
    instanceId: instanceIdContract.describe('The instance to read evidence from'),
    runId: runIdContract
      .optional()
      .describe(
        'The run to read. Omit to fall back to the latest run for a live instance; against a finished instance, omitting this too requires since: "boot" or the call refuses.',
      ),
    step: stepIndexContract.optional().describe('Narrow the resolved run to one step.'),
    kind: resultKindContract
      .optional()
      .describe(
        "Which evidence to read: 'console', 'network', 'ws', 'server', 'screenshots' or 'steps'. Omit for the run's own stored return.",
      ),
    where: resultWhereContract
      .optional()
      .describe('Narrow the matched rows by path, method, nth, level or step range.'),
    fields: z
      .array(resultFieldContract)
      .optional()
      .describe('Project each row down to only these field names.'),
    since: sinceMarkerContract
      .optional()
      .describe("Pass 'boot' to read across the instance's whole lifetime instead of one run."),
  })
  .strict();

export type SiegelenseResultsInput = z.infer<typeof siegelenseResultsInputContract>;
