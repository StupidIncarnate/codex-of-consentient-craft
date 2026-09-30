/**
 * PURPOSE: What `dungeonmaster siegelense run`'s argv parses into — the instance to drive, the
 * parsed batch of steps, and the batch's stop policy. Reach for this over `runRequestContract`:
 * that one is the shape `instanceRunBroker` reads to execute a batch, this one is what
 * `runArgsParseTransformer` hands back from `--instance`/`--steps`/`--steps-file`/`--stop-on`, and
 * the two stay separate files because an argv layer and a broker-request layer change for different
 * reasons even when their fields agree today (the same split `compareArgsContract` and
 * `compareQueryContract` already carry).
 *
 * USAGE:
 * runArgsContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
 *   stopOn: 'error',
 *   isJson: false,
 * });
 * // Returns a validated RunArgs
 */

import { z } from '#gateway/npm/zod';

import { stepContract } from '../step/step-contract';
import { stopOnContract } from '../stop-on/stop-on-contract';
import { siegeInstanceContract } from '@dungeonmaster/shared/contracts';

export const runArgsContract = z
  .object({
    instanceId: siegeInstanceContract.shape.id,
    steps: z.array(stepContract).readonly(),
    stopOn: stopOnContract,
    isJson: z.boolean(),
  })
  .strict().brand<'RunArgs'>();

export type RunArgs = z.infer<typeof runArgsContract>;
