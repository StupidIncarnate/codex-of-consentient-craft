/**
 * PURPOSE: Evaluates a list of SmoketestAssertions against the final state of a quest and returns pass/fail
 *
 * USAGE:
 * const outcome = smoketestAssertFinalStateBroker({ quest, assertions });
 * // Returns: { passed: true } when every assertion matches; otherwise { passed: false, failures: [...] }
 *
 * WHEN-TO-USE: At the tail end of each orchestration smoketest case, after the quest reaches a terminal status.
 * WHEN-NOT-TO-USE: Mid-run — this only reads the quest; it never subscribes to events or loads the quest itself.
 */

import type { Quest, WorkItemStatus } from '@dungeonmaster/shared/contracts';

import type { SmoketestAssertion } from '../../../contracts/smoketest-assertion/smoketest-assertion-contract';

export const smoketestAssertFinalStateBroker = ({
  quest,
  assertions,
}: {
  quest: Quest;
  assertions: readonly SmoketestAssertion[];
}): { passed: boolean; failures: readonly SmoketestAssertion[] } => {
  const failures = assertions.filter((assertion) => {
    if (assertion.kind === 'quest-status') {
      return quest.status !== assertion.expected;
    }

    if (assertion.kind === 'work-item-status-histogram') {
      const expectedEntries = Object.entries(assertion.expected);
      return expectedEntries.some(([status, expectedCount]) => {
        const actual = quest.workItems.filter(
          (item) => item.status === (status as WorkItemStatus),
        ).length;
        return actual !== expectedCount;
      });
    }

    // work-item-role-count
    const roleCount = quest.workItems.filter((item) => item.role === assertion.role).length;
    return roleCount < assertion.minCount;
  });

  return {
    passed: failures.length === 0,
    failures,
  };
};
