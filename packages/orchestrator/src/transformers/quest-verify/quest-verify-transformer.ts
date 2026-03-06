/**
 * PURPOSE: Runs all quest verification guards and builds a structured checks array with details for failures
 *
 * USAGE:
 * questVerifyTransformer({quest});
 * // Returns array of { name, passed, details } check results
 */
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import type { VerifyQuestCheck } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { verifyQuestCheckContract } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { questContractHasNoRawPrimitivesGuard } from '../../guards/quest-contract-has-no-raw-primitives/quest-contract-has-no-raw-primitives-guard';
import { questHasDependencyIntegrityGuard } from '../../guards/quest-has-dependency-integrity/quest-has-dependency-integrity-guard';
import { questHasFileCompanionsGuard } from '../../guards/quest-has-file-companions/quest-has-file-companions-guard';
import { questHasNoCircularDepsGuard } from '../../guards/quest-has-no-circular-deps/quest-has-no-circular-deps-guard';
import { questHasNoOrphanStepsGuard } from '../../guards/quest-has-no-orphan-steps/quest-has-no-orphan-steps-guard';
import { questHasNodeCoverageGuard } from '../../guards/quest-has-node-coverage/quest-has-node-coverage-guard';
import { questHasObservableCoverageGuard } from '../../guards/quest-has-observable-coverage/quest-has-observable-coverage-guard';
import { questStepHasContractRefsGuard } from '../../guards/quest-step-has-contract-refs/quest-step-has-contract-refs-guard';
import { questHasNoOrphanFlowNodesGuard } from '../../guards/quest-has-no-orphan-flow-nodes/quest-has-no-orphan-flow-nodes-guard';
import { questHasValidFlowRefsGuard } from '../../guards/quest-has-valid-flow-refs/quest-has-valid-flow-refs-guard';
import { questStepHasExportNameGuard } from '../../guards/quest-step-has-export-name/quest-step-has-export-name-guard';
import { questStepHasValidContractRefsGuard } from '../../guards/quest-step-has-valid-contract-refs/quest-step-has-valid-contract-refs-guard';

type Quest = ReturnType<typeof QuestStub>;

export const questVerifyTransformer = ({ quest }: { quest: Quest }): VerifyQuestCheck[] => {
  const checks: VerifyQuestCheck[] = [];

  const allObservableCount = quest.flows.flatMap((flow) =>
    flow.nodes.flatMap((node) => node.observables),
  ).length;

  const observableCoverage = questHasObservableCoverageGuard({
    flows: quest.flows,
    steps: quest.steps,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Observable Coverage',
      passed: observableCoverage,
      details: observableCoverage
        ? `All ${String(allObservableCount)} observables covered by steps`
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

  const noRawPrimitives = questContractHasNoRawPrimitivesGuard({
    contracts: quest.contracts,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'No Raw Primitives in Contracts',
      passed: noRawPrimitives,
      details: noRawPrimitives
        ? 'All contract properties use branded or non-primitive types'
        : 'Some contract properties use raw primitive types (string, number, any, object, unknown)',
    }),
  );

  const stepContractRefs = questStepHasContractRefsGuard({
    steps: quest.steps,
    contracts: quest.contracts,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Step Contract Declarations',
      passed: stepContractRefs,
      details: stepContractRefs
        ? 'All steps in contract-requiring folders have outputContracts declared'
        : 'Some steps are missing required contract declarations in outputContracts',
    }),
  );

  const validContractRefs = questStepHasValidContractRefsGuard({
    steps: quest.steps,
    contracts: quest.contracts,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Valid Contract References',
      passed: validContractRefs,
      details: validContractRefs
        ? 'All step inputContracts and outputContracts reference existing contracts'
        : 'Some steps reference non-existent contract names in inputContracts or outputContracts',
    }),
  );

  const stepExportNames = questStepHasExportNameGuard({
    steps: quest.steps,
    folderConfigs: folderConfigStatics,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Step Export Names',
      passed: stepExportNames,
      details: stepExportNames
        ? 'All steps creating entry files have exportName set'
        : 'Some steps with entry files are missing required exportName',
    }),
  );

  const validFlowRefs = questHasValidFlowRefsGuard({
    flows: quest.flows,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Valid Flow References',
      passed: validFlowRefs,
      details: validFlowRefs
        ? 'All flow edge references point to existing nodes'
        : 'Some flow edges reference non-existent node IDs',
    }),
  );

  const noOrphanFlowNodes = questHasNoOrphanFlowNodesGuard({
    flows: quest.flows,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'No Orphan Flow Nodes',
      passed: noOrphanFlowNodes,
      details: noOrphanFlowNodes
        ? 'All flow nodes are connected to at least one edge'
        : 'Some flow nodes have no edges connecting to or from them',
    }),
  );

  const nodeCoverage = questHasNodeCoverageGuard({
    flows: quest.flows,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: 'Node Observable Coverage',
      passed: nodeCoverage,
      details: nodeCoverage
        ? 'All terminal nodes have at least one observable'
        : 'Some terminal nodes are missing observables',
    }),
  );

  return checks;
};
