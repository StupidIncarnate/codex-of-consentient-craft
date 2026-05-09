/**
 * PURPOSE: Derives a bundled MCP/Signals smoketest blueprint plus a pre-stamped codeweaver work-item chain from a list of case-catalog entries
 *
 * USAGE:
 * const { blueprint, workItems } = caseCatalogToBlueprintTransformer({
 *   suite: 'mcp',
 *   cases: smoketestCaseCatalogStatics.mcp,
 *   now: IsoTimestampStub(),
 * });
 * // Returns a QuestBlueprint whose hydrator walk lands at in_progress with N chained steps (one per case),
 * // plus N codeweaver work items linearly chained via dependsOn, each carrying the case's promptKey-resolved
 * // smoketestPromptOverride. Ward/siegemaster/lawbringer/blightwarden roles are skipped so the chain is
 * // codeweaver-only.
 *
 * WHEN-TO-USE: The smoketest-run responder's MCP and Signals suites — one quest per suite with N floors.
 * WHEN-NOT-TO-USE: Orchestration scenarios — those use their own per-scenario blueprints from
 * smoketestScenariosStatics.
 */

import { streamSignalKindContract, workItemContract } from '@dungeonmaster/shared/contracts';
import type { QuestWorkItemId, WorkItem } from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { promptTextContract } from '../../contracts/prompt-text/prompt-text-contract';
import { questBlueprintContract } from '../../contracts/quest-blueprint/quest-blueprint-contract';
import type { QuestBlueprint } from '../../contracts/quest-blueprint/quest-blueprint-contract';
import { smoketestBlueprintsStatics } from '../../statics/smoketest-blueprints/smoketest-blueprints-statics';
import { smoketestPromptsStatics } from '../../statics/smoketest-prompts/smoketest-prompts-statics';

export const caseCatalogToBlueprintTransformer = ({
  suite,
  cases,
  now,
}: {
  suite: 'mcp' | 'signals';
  cases: readonly {
    caseId: string;
    name: string;
    promptKey: string;
    expectedSignal: string;
  }[];
  now: IsoTimestamp;
}): { blueprint: QuestBlueprint; workItems: WorkItem[] } => {
  const { minimal } = smoketestBlueprintsStatics;

  const suiteTitle = suite === 'mcp' ? 'Smoketest: MCP' : 'Smoketest: Signals';
  const suiteRequest =
    suite === 'mcp'
      ? 'Probe every registered MCP tool once and emit a signal-back per case'
      : 'Emit each scripted signal (complete / failed / failed-replan) once';

  const steps = cases.map((entry, index) => {
    const stepId = `case-${entry.caseId}`;
    const prev = index === 0 ? undefined : cases[index - 1];
    const prevStepId = prev === undefined ? undefined : `case-${prev.caseId}`;
    return {
      id: stepId,
      slice: 'case',
      name: entry.name,
      assertions: [
        {
          prefix: 'VALID' as const,
          input: `{orchestrator dispatches scripted agent for ${entry.caseId}}`,
          expected: `Agent emits scripted signal-back signal exactly once for ${entry.caseId}`,
        },
      ],
      observablesSatisfied: ['smoketest-signal-received'],
      dependsOn: prevStepId === undefined ? [] : [prevStepId],
      focusFile: {
        path: 'packages/orchestrator/src/statics/smoketest-case-catalog/smoketest-case-catalog-statics.ts',
      },
      accompanyingFiles: [],
      exportName: 'smoketestCaseCatalogStatics',
      inputContracts: ['Void'],
      outputContracts: ['SmoketestPlaceholder'],
      uses: [],
    };
  });

  const blueprint: QuestBlueprint = questBlueprintContract.parse({
    title: suiteTitle,
    userRequest: suiteRequest,
    designDecisions: minimal.designDecisions,
    contracts: minimal.contracts,
    toolingRequirements: minimal.toolingRequirements,
    flows: minimal.flows,
    planningNotes: minimal.planningNotes,
    steps,
    skipRoles: ['ward', 'siegemaster', 'lawbringer', 'blightwarden'],
  });

  const workItemIds: QuestWorkItemId[] = cases.map(() =>
    workItemContract.shape.id.parse(crypto.randomUUID()),
  );

  const workItems: WorkItem[] = cases.map((entry, index) => {
    const id = workItemIds[index];
    const prevId = index === 0 ? undefined : workItemIds[index - 1];
    const resolved: unknown =
      smoketestPromptsStatics[entry.promptKey as keyof typeof smoketestPromptsStatics];
    if (typeof resolved !== 'string') {
      throw new Error(
        `caseCatalogToBlueprintTransformer: no prompt found for promptKey "${entry.promptKey}"`,
      );
    }
    const override = promptTextContract.parse(resolved);
    const expectedSignal = streamSignalKindContract.parse(entry.expectedSignal);
    return workItemContract.parse({
      id,
      role: 'codeweaver',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: [`steps/case-${entry.caseId}`],
      dependsOn: prevId === undefined ? [] : [prevId],
      maxAttempts: 1,
      createdAt: now,
      smoketestPromptOverride: override,
      smoketestExpectedSignal: expectedSignal,
    });
  });

  return { blueprint, workItems };
};
