/**
 * PURPOSE: Defines the data held by `state` in smoketest-scenario-meta-state
 *
 * USAGE:
 * smoketestScenarioMetaStateContract.parse(value);
 * // Returns validated SmoketestScenarioMetaState
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';
import { smoketestScenarioMetaContract } from '../smoketest-scenario-meta/smoketest-scenario-meta-contract';

export const smoketestScenarioMetaStateContract = z
  .object({ entries: z.map(questContract.shape.id, smoketestScenarioMetaContract) })
  .brand<'SmoketestScenarioMetaState'>();

export type SmoketestScenarioMetaState = z.infer<typeof smoketestScenarioMetaStateContract>;
