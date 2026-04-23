/**
 * PURPOSE: Defines a single orchestration smoketest scenario — a quest blueprint plus per-role script of canned prompt names, final-state assertions, and optional teardown checks
 *
 * USAGE:
 * smoketestScenarioContract.parse({
 *   caseId: 'orch-happy',
 *   name: 'Orchestration: happy path',
 *   blueprint,
 *   scripts: { codeweaver: ['signalComplete'] },
 *   assertions: [{ kind: 'quest-status', expected: 'complete' }],
 * });
 * // Returns: SmoketestScenario
 */

import { z } from 'zod';

import { questBlueprintContract } from '../quest-blueprint/quest-blueprint-contract';
import {
  smoketestPromptsStatics,
  type SmoketestPromptName,
} from '../../statics/smoketest-prompts/smoketest-prompts-statics';
import { workItemRoleContract } from '@dungeonmaster/shared/contracts';
import { smoketestAssertionContract } from '../smoketest-assertion/smoketest-assertion-contract';
import { smoketestTeardownCheckContract } from '../smoketest-teardown-check/smoketest-teardown-check-contract';

const smoketestPromptNames = Object.keys(smoketestPromptsStatics) as [
  SmoketestPromptName,
  ...SmoketestPromptName[],
];

const smoketestPromptNameContract = z.enum(smoketestPromptNames);

export const smoketestScenarioContract = z.object({
  caseId: z.string().min(1).brand<'SmoketestCaseId'>(),
  name: z.string().min(1).brand<'SmoketestScenarioName'>(),
  blueprint: questBlueprintContract,
  scripts: z.record(workItemRoleContract, z.array(smoketestPromptNameContract).readonly()),
  assertions: z.array(smoketestAssertionContract),
  postTeardownChecks: z.array(smoketestTeardownCheckContract).optional(),
});

export type SmoketestScenario = z.infer<typeof smoketestScenarioContract>;
