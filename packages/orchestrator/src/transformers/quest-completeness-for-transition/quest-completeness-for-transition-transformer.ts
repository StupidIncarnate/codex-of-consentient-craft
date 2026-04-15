/**
 * PURPOSE: Returns failed completeness checks gating the proposed quest status transition (cumulative)
 *
 * USAGE:
 * questCompletenessForTransitionTransformer({quest, nextStatus: 'review_observables'});
 * // Returns VerifyQuestCheck[] of failed checks. Empty array means quest passes the transition gate.
 *
 * Branch scoping:
 *   review_flows                          -> flow-completeness scope only
 *   review_observables                    -> flow-completeness + spec-completeness (cumulative)
 *   seek_synth | seek_walk | seek_plan    -> no additional checks (presence gates live in
 *                                             hasQuestGateContentGuard; see plan §2, §4)
 *   in_progress (FROM seek_plan only)     -> spec-completeness fold + inline step-structure checks
 *                                             + planningNotes.reviewReport signal gate
 *   in_progress (FROM any other status)   -> no checks (preserves blocked/paused → in_progress
 *                                             resume paths — confirmed via plan §4)
 *   any other status                      -> []
 *
 * Severity encoding (existing codebase convention):
 *   - VerifyQuestCheck.passed === false  => blocking failedCheck
 *   - VerifyQuestCheck.passed === true   => non-blocking info-level entry (emitted only by the
 *                                            seek_plan → in_progress branch to surface a warnings
 *                                            signal from planningNotes.reviewReport to the caller).
 *   The contract has no severity field — `passed` IS the severity flag.
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '@dungeonmaster/shared/contracts';
import { verifyQuestCheckContract } from '@dungeonmaster/shared/contracts';
import { questCyclicStepDepsTransformer } from '../quest-cyclic-step-deps/quest-cyclic-step-deps-transformer';
import { questStepsMissingFocusTargetTransformer } from '../quest-steps-missing-focus-target/quest-steps-missing-focus-target-transformer';
import { questUnresolvedStepDepsTransformer } from '../quest-unresolved-step-deps/quest-unresolved-step-deps-transformer';
import { questValidateSpecTransformer } from '../quest-validate-spec/quest-validate-spec-transformer';

type Quest = ReturnType<typeof QuestStub>;

const checkNameSchema = verifyQuestCheckContract.shape.name;
const checkDetailsSchema = verifyQuestCheckContract.shape.details;

export const questCompletenessForTransitionTransformer = ({
  quest,
  nextStatus,
}: {
  quest: Quest;
  nextStatus: QuestStatus;
}): VerifyQuestCheck[] => {
  if (nextStatus === 'review_flows') {
    const flowChecks = questValidateSpecTransformer({ quest, scope: 'flow-completeness' });
    return flowChecks.filter((check) => !check.passed);
  }

  if (nextStatus === 'review_observables') {
    const flowChecks = questValidateSpecTransformer({ quest, scope: 'flow-completeness' });
    const specChecks = questValidateSpecTransformer({ quest, scope: 'spec-completeness' });
    return [...flowChecks, ...specChecks].filter((check) => !check.passed);
  }

  if (nextStatus === 'in_progress' && quest.status === 'seek_plan') {
    const results: VerifyQuestCheck[] = [];

    // Fold: spec-completeness scope covers the spec structural invariants that must still
    // hold when entering execution (terminal obs coverage, observable descriptions, design
    // decision rationale). Note: the "step-structure" offenders (focus target, dep refs,
    // cycles) are NOT in spec-completeness — they are called as separate offender-finders
    // below since matching offender-finders did not exist before this branch.
    const specChecks = questValidateSpecTransformer({ quest, scope: 'spec-completeness' });
    for (const check of specChecks) {
      if (!check.passed) {
        results.push(check);
      }
    }

    const focusOffenders = questStepsMissingFocusTargetTransformer({ steps: quest.steps });
    if (focusOffenders.length > 0) {
      results.push(
        verifyQuestCheckContract.parse({
          name: checkNameSchema.parse('Step Focus Target'),
          passed: false,
          details: checkDetailsSchema.parse(
            `Steps missing focusFile/focusAction: ${focusOffenders.map((offender) => String(offender)).join('; ')}`,
          ),
        }),
      );
    }

    const depOffenders = questUnresolvedStepDepsTransformer({ steps: quest.steps });
    if (depOffenders.length > 0) {
      results.push(
        verifyQuestCheckContract.parse({
          name: checkNameSchema.parse('Step Dependency References'),
          passed: false,
          details: checkDetailsSchema.parse(
            `Unresolved step dependsOn references: ${depOffenders.map((offender) => String(offender)).join('; ')}`,
          ),
        }),
      );
    }

    const cycleOffenders = questCyclicStepDepsTransformer({ steps: quest.steps });
    if (cycleOffenders.length > 0) {
      results.push(
        verifyQuestCheckContract.parse({
          name: checkNameSchema.parse('Step Dependency Graph'),
          passed: false,
          details: checkDetailsSchema.parse(
            `Cycles in step dependsOn graph: ${cycleOffenders.map((offender) => String(offender)).join('; ')}`,
          ),
        }),
      );
    }

    // Plan review report gate: blocking for missing / critical, info-level for warnings,
    // clean emits nothing.
    const { reviewReport } = quest.planningNotes;
    if (reviewReport === undefined) {
      results.push(
        verifyQuestCheckContract.parse({
          name: checkNameSchema.parse('Plan Review Report'),
          passed: false,
          details: checkDetailsSchema.parse(
            'Missing planningNotes.reviewReport: plan review must be completed before transition to in_progress',
          ),
        }),
      );
    } else if (reviewReport.signal === 'critical') {
      const items = reviewReport.criticalItems.map((item) => String(item)).join('; ');
      results.push(
        verifyQuestCheckContract.parse({
          name: checkNameSchema.parse('Plan Review Report'),
          passed: false,
          details: checkDetailsSchema.parse(`Plan review reported critical issues: ${items}`),
        }),
      );
    } else if (reviewReport.signal === 'warnings') {
      const warningText = reviewReport.warnings.map((item) => String(item)).join('; ');
      results.push(
        verifyQuestCheckContract.parse({
          name: checkNameSchema.parse('Plan Review Report'),
          passed: true,
          details: checkDetailsSchema.parse(
            `Plan review reported warnings (non-blocking): ${warningText}`,
          ),
        }),
      );
    }

    return results;
  }

  return [];
};
