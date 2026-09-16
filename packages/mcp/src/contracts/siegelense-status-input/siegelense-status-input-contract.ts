/**
 * PURPOSE: Validates input for the `siegelense-status` MCP tool — `{}` for the whole fleet listing,
 * `{ instanceId }` for one instance in full. The same shape either way; the responder reads whether
 * `instanceId` arrived to choose which answer `statusReadBroker` builds. `.strict()` rejects any
 * other key by name, since this is parsed straight from untrusted tool-call input.
 *
 * USAGE:
 * siegelenseStatusInputContract.parse({});
 * // Returns SiegelenseStatusInput with instanceId absent — the fleet form
 */

import { z } from 'zod';

import { instanceIdContract } from '@dungeonmaster/siegelense/contracts';

export const siegelenseStatusInputContract = z
  .object({
    instanceId: instanceIdContract
      .optional()
      .describe(
        'The one instance to report on in full — last beat, last step, RSS, orphans, evidence paths, likelyCause. Omit for the whole fleet: every instance, alive or dead, with no runs or evidence listed for any of them.',
      ),
  })
  .strict();

export type SiegelenseStatusInput = z.infer<typeof siegelenseStatusInputContract>;
