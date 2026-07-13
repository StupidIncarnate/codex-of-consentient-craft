/**
 * PURPOSE: Derives a bundled MCP/Signals smoketest blueprint plus a pre-stamped codeweaver work-item
 * chain from a list of case-catalog entries
 *
 * USAGE:
 * const { blueprint, workItems } = caseCatalogToBlueprintTransformer({
 *   suite: 'mcp',
 *   cases: smoketestCaseCatalogStatics.mcp,
 *   now: IsoTimestampStub(),
 * });
 * // Returns a QuestBlueprint carrying one codeweaver operation item per case, plus N codeweaver work
 * // items linearly chained via dependsOn — each linked to its operation item via
 * // relatedDataItems: ['operations/<id>'] and stamped with the case's promptKey-resolved
 * // smoketestPromptOverride. Ward/flowrider/siegemaster/lawbringer/blightwarden roles are skipped so
 * // the relay tail never runs — the chain is codeweaver-only.
 *
 * WHEN-TO-USE: The smoketest-run responder's MCP and Signals suites — one quest per suite with N cases.
 * WHEN-NOT-TO-USE: Orchestration scenarios — those use their own per-scenario blueprints from
 * smoketestScenariosStatics.
 */

import {
  operationItemContract,
  streamSignalKindContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { OperationItem, WorkItem } from '@dungeonmaster/shared/contracts';

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
      : 'Emit a scripted signal-back once per case';

  // One operation item + one work-item id per case, generated in a single pass so each work item
  // can link to its own operation item via `operations/<id>` (the strict 1:1 link invariant).
  const built = cases.map((entry) => ({
    entry,
    operation: operationItemContract.parse({
      id: crypto.randomUUID(),
      role: 'codeweaver',
      text: entry.name,
      status: 'pending',
      locked: false,
    }),
    workItemId: workItemContract.shape.id.parse(crypto.randomUUID()),
  }));

  const operations: OperationItem[] = built.map((item) => item.operation);

  const blueprint: QuestBlueprint = questBlueprintContract.parse({
    title: suiteTitle,
    userRequest: suiteRequest,
    designDecisions: minimal.designDecisions,
    contracts: minimal.contracts,
    toolingRequirements: minimal.toolingRequirements,
    flows: minimal.flows,
    operations,
    skipRoles: ['ward', 'flowrider', 'siegemaster', 'lawbringer', 'blightwarden'],
  });

  const workItems: WorkItem[] = built.map(({ entry, operation, workItemId }, index) => {
    const prev = index === 0 ? undefined : built[index - 1];
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
      id: workItemId,
      role: 'codeweaver',
      status: 'pending',
      spawnerType: 'agent',
      relatedDataItems: [`operations/${String(operation.id)}`],
      dependsOn: prev === undefined ? [] : [prev.workItemId],
      maxAttempts: 1,
      createdAt: now,
      smoketestPromptOverride: override,
      smoketestExpectedSignal: expectedSignal,
    });
  });

  return { blueprint, workItems };
};
