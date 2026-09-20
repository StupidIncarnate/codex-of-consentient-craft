/**
 * PURPOSE: What `dungeonmaster siegelense profile`'s argv parses down to — which spec to report on,
 * and whether to output raw JSON rather than the default concise human summary. `--spec` is
 * required, and `isJson` defaults to false.
 *
 * USAGE:
 * profileArgsContract.parse({ specName: 'dungeonmaster-stack', isJson: false });
 * // Returns a validated ProfileArgs
 */

import { z } from 'zod';

import { specNameContract } from '../spec-name/spec-name-contract';

export const profileArgsContract = z
  .object({
    specName: specNameContract,
    isJson: z.boolean().default(false),
  })
  .strict();

export type ProfileArgs = z.infer<typeof profileArgsContract>;
