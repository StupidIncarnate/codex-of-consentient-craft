/**
 * PURPOSE: One `run` call's whole input — the instance to drive, the batch of steps, and the
 * batch's own stop policy. Reach for this over `stepContract` alone whenever the value is what a
 * session actually submits to `run`; a bare `Step[]` says nothing about which instance receives it
 * or whether a failing step should halt the rest (siegelense-tooling.md line 1648: "A batch stops
 * on first failure BY DEFAULT, overridable per step with `expect: 'error'` and per batch with
 * `stopOn: 'never'`").
 *
 * USAGE:
 * runRequestContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
 *   stopOn: 'error',
 * });
 * // Returns a validated RunRequest
 */

import { z } from 'zod';

import { instanceIdContract } from '../instance-id/instance-id-contract';
import { stepContract } from '../step/step-contract';
import { stopOnContract } from '../stop-on/stop-on-contract';

export const runRequestContract = z.object({
  instanceId: instanceIdContract,
  steps: z.array(stepContract).readonly(),
  stopOn: stopOnContract,
});

export type RunRequest = z.infer<typeof runRequestContract>;
