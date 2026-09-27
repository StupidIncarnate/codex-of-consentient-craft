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

// `z.partialRecord`, not `z.record` — zod v4 made an enum-keyed `z.record` exhaustive (every role
// required), and a real scenario only ever scripts the roles it dispatches.
export const scenarioInstanceContract = z.object({
  scripts: z.partialRecord(workItemRoleContract, z.array(smoketestPromptNameContract).readonly()),
  callOrdinals: z.partialRecord(workItemRoleContract, arrayIndexContract),
});

export type ScenarioInstance = z.infer<typeof scenarioInstanceContract>;
