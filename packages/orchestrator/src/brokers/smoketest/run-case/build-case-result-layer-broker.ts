/**
 * PURPOSE: Shapes a SmoketestCaseResult literal from a scenario's final quest plus assertion and teardown failure lists
 *
 * USAGE:
 * const shape = buildCaseResultLayerBroker({
 *   scenario,
 *   startedAt,
 *   finalQuest,
 *   assertionFailures: [],
 *   teardownFailures: [],
 * });
 * // Returns: object ready to pass to smoketestCaseResultContract.parse — passed=true when both failure lists are empty.
 * // When the case passed because all workItems are terminal (but quest.status is not itself in {complete, blocked,
 * // abandoned}), the summary gets a `(workItems-terminal)` suffix so the drawer makes that visible.
 *
 * WHEN-TO-USE: Called once by smoketestRunCaseBroker after the assertion + teardown brokers report.
 * WHEN-NOT-TO-USE: Error paths. The parent broker hands errors directly to the contract parser.
 */

import {
  isQuestBlockedQuestStatusGuard,
  isTerminalQuestStatusGuard,
  isTerminalWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';
import type { Quest, SmoketestCaseResult } from '@dungeonmaster/shared/contracts';

import type { SmoketestAssertion } from '../../../contracts/smoketest-assertion/smoketest-assertion-contract';
import type { SmoketestTeardownCheck } from '../../../contracts/smoketest-teardown-check/smoketest-teardown-check-contract';
import type { SmoketestScenario } from '../../../contracts/smoketest-scenario/smoketest-scenario-contract';

type CaseResultShape = Omit<SmoketestCaseResult, 'caseId' | 'name'> & {
  caseId: SmoketestScenario['caseId'];
  name: SmoketestScenario['name'];
};

export const buildCaseResultLayerBroker = ({
  scenario,
  startedAt,
  finalQuest,
  assertionFailures,
  teardownFailures,
}: {
  scenario: SmoketestScenario;
  startedAt: number;
  finalQuest: Quest;
  assertionFailures: readonly SmoketestAssertion[];
  teardownFailures: readonly SmoketestTeardownCheck[];
}): CaseResultShape => {
  const durationMs = Date.now() - startedAt;
  const passed = assertionFailures.length === 0 && teardownFailures.length === 0;

  if (passed) {
    const allWorkItemsTerminal =
      finalQuest.workItems.length > 0 &&
      finalQuest.workItems.every((item) => isTerminalWorkItemStatusGuard({ status: item.status }));
    // `isTerminalQuestStatusGuard` treats only `complete` / `abandoned` as terminal (not `blocked`).
    // For the smoketest summary annotation we also consider `blocked` a direct quest-status
    // terminal — so annotate `(workItems-terminal)` only when the quest status itself is NOT
    // in {complete, blocked, abandoned} but every work item is terminal.
    const questStatusIsDirectTerminal =
      isTerminalQuestStatusGuard({ status: finalQuest.status }) ||
      isQuestBlockedQuestStatusGuard({ status: finalQuest.status });
    const triggeredByWorkItems = !questStatusIsDirectTerminal && allWorkItemsTerminal;
    const summary = triggeredByWorkItems
      ? `final-status=${finalQuest.status} (workItems-terminal)`
      : `final-status=${finalQuest.status}`;
    return {
      caseId: scenario.caseId,
      name: scenario.name,
      passed: true,
      durationMs,
      summary,
    } as CaseResultShape;
  }

  const assertionSummary = assertionFailures.map((failure) => failure.kind).join(',');
  const teardownSummary = teardownFailures.map((failure) => failure.kind).join(',');
  const assertionPart =
    assertionFailures.length === 0 ? '' : `assertion-failures=[${assertionSummary}]`;
  const teardownPart =
    teardownFailures.length === 0 ? '' : `teardown-failures=[${teardownSummary}]`;
  const errorMessage = [assertionPart, teardownPart].filter((part) => part.length > 0).join('; ');

  return {
    caseId: scenario.caseId,
    name: scenario.name,
    passed: false,
    durationMs,
    errorMessage,
  } as CaseResultShape;
};
