/**
 * PURPOSE: Validates input for the `siegelense-run` MCP tool — the instance to drive, the batch of
 * steps to submit, and the batch's own stop policy. `steps` reuses `stepContract` from
 * `@dungeonmaster/siegelense/contracts` rather than re-declaring the six-verb union, so a step this
 * tool accepts and a step the driver accepts can never drift apart. `stopOn` defaults to
 * `stepStatics.defaults.stopOn` — the same default `stepContract` already applies per-step to
 * `expect` — so an ordinary caller never has to name it.
 *
 * USAGE:
 * siegelenseRunInputContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
 * });
 * // Returns SiegelenseRunInput with stopOn defaulted to 'error'
 */

import { z } from 'zod';

import {
  instanceIdContract,
  stepContract,
  stopOnContract,
} from '@dungeonmaster/siegelense/contracts';
import { stepStatics } from '@dungeonmaster/siegelense/statics';

export const siegelenseRunInputContract = z
  .object({
    instanceId: instanceIdContract.describe('The instance to run this batch against'),
    steps: z.array(stepContract).describe('The batch of steps to run, in order'),
    stopOn: stopOnContract
      .default(stepStatics.defaults.stopOn)
      .describe(
        "The batch's own stop policy — 'error' (default) stops on the first failing step, 'never' runs every step regardless",
      ),
  })
  .strict();

export type SiegelenseRunInput = z.infer<typeof siegelenseRunInputContract>;
