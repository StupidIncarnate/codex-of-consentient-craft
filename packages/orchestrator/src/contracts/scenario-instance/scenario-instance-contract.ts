/**
 * PURPOSE: Runtime shape stored in smoketestScenarioState per active quest — per-role script of canned prompt names plus per-role dispense call ordinals
 *
 * USAGE:
 * scenarioInstanceContract.parse({ scripts: { codeweaver: ['signalComplete'] }, callOrdinals: {} });
 * // Returns: ScenarioInstance
 */

import { z } from 'zod';

import { arrayIndexContract, workItemRoleContract } from '@dungeonmaster/shared/contracts';

import {
  smoketestPromptsStatics,
  type SmoketestPromptName,
} from '../../statics/smoketest-prompts/smoketest-prompts-statics';

const smoketestPromptNames = Object.keys(smoketestPromptsStatics) as [
  SmoketestPromptName,
  ...SmoketestPromptName[],
];

const smoketestPromptNameContract = z.enum(smoketestPromptNames);

export const scenarioInstanceContract = z.object({
  scripts: z.record(workItemRoleContract, z.array(smoketestPromptNameContract).readonly()),
  callOrdinals: z.record(workItemRoleContract, arrayIndexContract),
});

export type ScenarioInstance = z.infer<typeof scenarioInstanceContract>;
