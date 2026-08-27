/**
 * PURPOSE: Runs save-time structural invariants on a quest and returns ONLY failed checks
 *
 * USAGE:
 * questSaveInvariantsTransformer({quest, currentStatus: 'review_flows', nextStatus: 'flows_approved'});
 * // Returns VerifyQuestCheck[] containing only the failed invariants. Empty array means quest passes.
 *
 * Two kinds of check live here. The status-independent ones ('invariants' scope) hold on every write.
 * The four PACKAGE-RELATIONAL ones each bind at the one gate where their inputs first all exist, and
 * each emits ONE check per offender so the name of the offending node, edge, or package survives into
 * the `- [FAIL] <name>: <details>` line the agent reads:
 *
 *   flows_approved  Node Package Coverage       every node tags a package, and every tag is declared
 *   flows_approved  No Unglued Seam             every edge's endpoints share a package
 *   approved        Observable Package Attribution  every observable sits on a side its node tags,
 *                                               and a seam node's observables cover both sides
 *   approved        Contract Source Coverage    every authored contract's source sits under a
 *                                               declared package
 *
 * `Contract Source Coverage` replaced `Codeweaver Package Coverage`, which asked whether the
 * AUTHORED ledger claimed every package the spine lands in. There is no authored ledger any more:
 * the codeweaver items are DERIVED at Start from the node tags and the contract source paths, so
 * package coverage is definitional rather than checkable. What is still checkable — and is now the
 * one generator input nothing else enforces — is that each contract's `source` resolves somewhere,
 * since `questContractEntryContract` requires the field but validates nothing about the path.
 *
 * These deliberately do NOT go through `hasQuestGateContentGuard`. That guard expresses only
 * at-least-one-item-with-key=value, and its rejection is the detail-free `Missing required content
 * for transition to <status>` with no `failedChecks` — which tells an author a gate closed but never
 * which node closed it. Acceptance against the spec is still verified at runtime by ward plus the
 * verify roles looping to done, not by a static save-time gate.
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';

import type { ErrorMessage, VerifyQuestCheck } from '@dungeonmaster/shared/contracts';
import { verifyQuestCheckContract } from '@dungeonmaster/shared/contracts';

import { questContractSourceCoverageViolationsTransformer } from '../quest-contract-source-coverage-violations/quest-contract-source-coverage-violations-transformer';
import { questNodePackageCoverageViolationsTransformer } from '../quest-node-package-coverage-violations/quest-node-package-coverage-violations-transformer';
import { questObservableAttributionViolationsTransformer } from '../quest-observable-attribution-violations/quest-observable-attribution-violations-transformer';
import { questUngluedSeamEdgesTransformer } from '../quest-unglued-seam-edges/quest-unglued-seam-edges-transformer';
import { questValidateSpecTransformer } from '../quest-validate-spec/quest-validate-spec-transformer';

type Quest = ReturnType<typeof QuestStub>;

export const questSaveInvariantsTransformer = ({
  quest,
  nextStatus,
}: {
  quest: Quest;
  currentStatus?: QuestStatus;
  nextStatus?: QuestStatus;
}): VerifyQuestCheck[] => {
  const invariantChecks = questValidateSpecTransformer({ quest, scope: 'invariants' });
  const failures = invariantChecks.filter((check) => !check.passed);

  const relational: { name: unknown; offenders: ErrorMessage[] }[] = [];

  if (nextStatus === 'flows_approved') {
    relational.push(
      {
        name: 'Node Package Coverage',
        offenders: questNodePackageCoverageViolationsTransformer({
          flows: quest.flows,
          packagesAffected: quest.packagesAffected,
        }),
      },
      {
        name: 'No Unglued Seam',
        offenders: questUngluedSeamEdgesTransformer({ flows: quest.flows }),
      },
    );
  }

  if (nextStatus === 'approved') {
    relational.push({
      name: 'Observable Package Attribution',
      offenders: questObservableAttributionViolationsTransformer({ flows: quest.flows }),
    });

    // Scoped to feature quests: only a feature quest derives one codeweaver item per package, so
    // only there does an unresolvable contract source reach no session at all. A bug-hunt's
    // single orchestrator-seeded pesteater item covers the quest whatever its contracts say, and
    // refusing one for a path that routes nothing would be a gate with no consequence behind it.
    if (quest.questType === 'feature') {
      relational.push({
        name: 'Contract Source Coverage',
        offenders: questContractSourceCoverageViolationsTransformer({
          contracts: quest.contracts,
          packagesAffected: quest.packagesAffected,
        }),
      });
    }
  }

  const relationalChecks = relational.flatMap((rule) =>
    rule.offenders.map((offender) =>
      verifyQuestCheckContract.parse({
        name: String(rule.name),
        passed: false,
        details: String(offender),
      }),
    ),
  );

  return [...failures, ...relationalChecks];
};
