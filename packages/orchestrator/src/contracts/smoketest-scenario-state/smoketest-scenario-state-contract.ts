/**
 * PURPOSE: Defines the data held by `state` in smoketest-scenario-state
 *
 * USAGE:
 * smoketestScenarioStateContract.parse(value);
 * // Returns validated SmoketestScenarioState
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';
import { scenarioInstanceContract } from '../scenario-instance/scenario-instance-contract';

export const smoketestScenarioStateContract = z
  .object({ instances: z.map(questContract.shape.id, scenarioInstanceContract) })
  .brand<'SmoketestScenarioState'>();

export type SmoketestScenarioState = z.infer<typeof smoketestScenarioStateContract>;
