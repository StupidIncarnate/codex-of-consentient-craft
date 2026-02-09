/**
 * PURPOSE: Runs all quest verification guards and builds a structured checks array with details for failures
 *
 * USAGE:
 * questVerifyTransformer({quest});
 * // Returns array of { name, passed, details } check results
 */
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { verifyQuestCheckContract } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { questHasObservableCoverageGuard } from '../../guards/quest-has-observable-coverage/quest-has-observable-coverage-guard';
import { questHasDependencyIntegrityGuard } from '../../guards/quest-has-dependency-integrity/quest-has-dependency-integrity-guard';
import { questHasNoCircularDepsGuard } from '../../guards/quest-has-no-circular-deps/quest-has-no-circular-deps-guard';
import { questHasNoOrphanStepsGuard } from '../../guards/quest-has-no-orphan-steps/quest-has-no-orphan-steps-guard';
import { questHasValidContextRefsGuard } from '../../guards/quest-has-valid-context-refs/quest-has-valid-context-refs-guard';
import { questHasValidRequirementRefsGuard } from '../../guards/quest-has-valid-requirement-refs/quest-has-valid-requirement-refs-guard';
import { questHasFileCompanionsGuard } from '../../guards/quest-has-file-companions/quest-has-file-companions-guard';

type Quest = ReturnType<typeof QuestStub>;

export const questVerifyTransformer = ({ quest }: { quest: Quest }): VerifyQuestCheck[] => {
  const checks: VerifyQuestCheck[] = [];

  const observableCoverage = questHasObservableCoverageGuard({
    observables: quest.observables,
    steps: quest.steps,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Observable Coverage',
      passed: observableCoverage,
      details: observableCoverage
        ? `All ${String(quest.observables.length)} observables covered by steps`
        : `Some observables not covered by any step's observablesSatisfied`,
    }),
  );

  const dependencyIntegrity = questHasDependencyIntegrityGuard({ steps: quest.steps });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Dependency Integrity',
      passed: dependencyIntegrity,
      details: dependencyIntegrity
        ? 'All step dependsOn references point to existing steps'
        : 'Some steps reference non-existent step IDs in dependsOn',
    }),
  );

  const noCircularDeps = questHasNoCircularDepsGuard({ steps: quest.steps });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'No Circular Dependencies',
      passed: noCircularDeps,
      details: noCircularDeps
        ? 'Step dependency graph is a valid DAG'
        : 'Circular dependency detected in step dependency graph',
    }),
  );

  const noOrphanSteps = questHasNoOrphanStepsGuard({ steps: quest.steps });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'No Orphan Steps',
      passed: noOrphanSteps,
      details: noOrphanSteps
        ? `All ${String(quest.steps.length)} steps satisfy at least one observable`
        : 'Some steps have empty observablesSatisfied arrays',
    }),
  );

  const validContextRefs = questHasValidContextRefsGuard({
    observables: quest.observables,
    contexts: quest.contexts,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Valid Context References',
      passed: validContextRefs,
      details: validContextRefs
        ? 'All observable contextId references point to existing contexts'
        : 'Some observables reference non-existent context IDs',
    }),
  );

  const validRequirementRefs = questHasValidRequirementRefsGuard({
    observables: quest.observables,
    requirements: quest.requirements,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Valid Requirement References',
      passed: validRequirementRefs,
      details: validRequirementRefs
        ? 'All observable requirementId references point to existing requirements'
        : 'Some observables reference non-existent requirement IDs',
    }),
  );

  const fileCompanions = questHasFileCompanionsGuard({ steps: quest.steps });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'File Companion Completeness',
      passed: fileCompanions,
      details: fileCompanions
        ? 'All implementation files have required companion files (test, proxy, stub)'
        : 'Some implementation files are missing required companion files',
    }),
  );

  return checks;
};
