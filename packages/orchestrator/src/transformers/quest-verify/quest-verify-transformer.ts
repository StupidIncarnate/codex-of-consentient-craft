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

import { questHasNodeCoverageGuard } from '../../guards/quest-has-node-coverage/quest-has-node-coverage-guard';
import { questHasObservableCoverageGuard } from '../../guards/quest-has-observable-coverage/quest-has-observable-coverage-guard';
import { questStepHasContractRefsGuard } from '../../guards/quest-step-has-contract-refs/quest-step-has-contract-refs-guard';
import { questHasNoOrphanFlowNodesGuard } from '../../guards/quest-has-no-orphan-flow-nodes/quest-has-no-orphan-flow-nodes-guard';
import { questHasValidFlowRefsGuard } from '../../guards/quest-has-valid-flow-refs/quest-has-valid-flow-refs-guard';
import { questStepHasExportNameGuard } from '../../guards/quest-step-has-export-name/quest-step-has-export-name-guard';
import { questStepHasValidContractRefsGuard } from '../../guards/quest-step-has-valid-contract-refs/quest-step-has-valid-contract-refs-guard';
import { questStepHasNoDuplicateFocusFilesGuard } from '../../guards/quest-step-has-no-duplicate-focus-files/quest-step-has-no-duplicate-focus-files-guard';
import { questStepHasValidAssertionsGuard } from '../../guards/quest-step-has-valid-assertions/quest-step-has-valid-assertions-guard';
import { questStepHasValidFocusFileGuard } from '../../guards/quest-step-has-valid-focus-file/quest-step-has-valid-focus-file-guard';
import { questVerifyFailureDetailsTransformer } from '../quest-verify-failure-details/quest-verify-failure-details-transformer';

type Quest = ReturnType<typeof QuestStub>;

const checkNameSchema = verifyQuestCheckContract.shape.name;

export const questVerifyTransformer = ({ quest }: { quest: Quest }): VerifyQuestCheck[] => {
  const checks: VerifyQuestCheck[] = [];

  const allObservableCount = quest.flows.flatMap((flow) =>
    flow.nodes.flatMap((node) => node.observables),
  ).length;

  const observableCoverageName = checkNameSchema.parse('Observable Coverage');
  const observableCoverage = questHasObservableCoverageGuard({
    flows: quest.flows,
    steps: quest.steps,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: observableCoverageName,
      passed: observableCoverage,
      details: observableCoverage
        ? `All ${String(allObservableCount)} observables covered by steps`
        : questVerifyFailureDetailsTransformer({ quest, checkName: observableCoverageName }),
    }),
  );

  const dependencyIntegrityName = checkNameSchema.parse('Dependency Integrity');
  const dependencyIntegrity = questHasDependencyIntegrityGuard({ steps: quest.steps });
  checks.push(
    verifyQuestCheckContract.parse({
      name: dependencyIntegrityName,
      passed: dependencyIntegrity,
      details: dependencyIntegrity
        ? 'All step dependsOn references point to existing steps'
        : questVerifyFailureDetailsTransformer({ quest, checkName: dependencyIntegrityName }),
    }),
  );

  const noCircularDepsName = checkNameSchema.parse('No Circular Dependencies');
  const noCircularDeps = questHasNoCircularDepsGuard({ steps: quest.steps });
  checks.push(
    verifyQuestCheckContract.parse({
      name: noCircularDepsName,
      passed: noCircularDeps,
      details: noCircularDeps
        ? 'Step dependency graph is a valid DAG'
        : questVerifyFailureDetailsTransformer({ quest, checkName: noCircularDepsName }),
    }),
  );

  const fileCompanionsName = checkNameSchema.parse('File Companion Completeness');
  const fileCompanions = questHasFileCompanionsGuard({ steps: quest.steps });
  checks.push(
    verifyQuestCheckContract.parse({
      name: fileCompanionsName,
      passed: fileCompanions,
      details: fileCompanions
        ? 'All implementation files have required companion files (test, proxy, stub)'
        : questVerifyFailureDetailsTransformer({ quest, checkName: fileCompanionsName }),
    }),
  );

  const noRawPrimitivesName = checkNameSchema.parse('No Raw Primitives in Contracts');
  const noRawPrimitives = questContractHasNoRawPrimitivesGuard({
    contracts: quest.contracts,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: noRawPrimitivesName,
      passed: noRawPrimitives,
      details: noRawPrimitives
        ? 'All contract properties use branded or non-primitive types'
        : questVerifyFailureDetailsTransformer({ quest, checkName: noRawPrimitivesName }),
    }),
  );

  const stepContractRefsName = checkNameSchema.parse('Step Contract Declarations');
  const stepContractRefs = questStepHasContractRefsGuard({
    steps: quest.steps,
    contracts: quest.contracts,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: stepContractRefsName,
      passed: stepContractRefs,
      details: stepContractRefs
        ? 'All steps in contract-requiring folders have outputContracts declared'
        : questVerifyFailureDetailsTransformer({ quest, checkName: stepContractRefsName }),
    }),
  );

  const validContractRefsName = checkNameSchema.parse('Valid Contract References');
  const validContractRefs = questStepHasValidContractRefsGuard({
    steps: quest.steps,
    contracts: quest.contracts,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: validContractRefsName,
      passed: validContractRefs,
      details: validContractRefs
        ? 'All step inputContracts and outputContracts reference existing contracts'
        : questVerifyFailureDetailsTransformer({ quest, checkName: validContractRefsName }),
    }),
  );

  const stepExportNamesName = checkNameSchema.parse('Step Export Names');
  const stepExportNames = questStepHasExportNameGuard({
    steps: quest.steps,
    folderConfigs: folderConfigStatics,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: stepExportNamesName,
      passed: stepExportNames,
      details: stepExportNames
        ? 'All steps creating entry files have exportName set'
        : questVerifyFailureDetailsTransformer({ quest, checkName: stepExportNamesName }),
    }),
  );

  const validFlowRefsName = checkNameSchema.parse('Valid Flow References');
  const validFlowRefs = questHasValidFlowRefsGuard({
    flows: quest.flows,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: validFlowRefsName,
      passed: validFlowRefs,
      details: validFlowRefs
        ? 'All flow edge references point to existing nodes'
        : questVerifyFailureDetailsTransformer({ quest, checkName: validFlowRefsName }),
    }),
  );

  const noOrphanFlowNodesName = checkNameSchema.parse('No Orphan Flow Nodes');
  const noOrphanFlowNodes = questHasNoOrphanFlowNodesGuard({
    flows: quest.flows,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: noOrphanFlowNodesName,
      passed: noOrphanFlowNodes,
      details: noOrphanFlowNodes
        ? 'All flow nodes are connected to at least one edge'
        : questVerifyFailureDetailsTransformer({ quest, checkName: noOrphanFlowNodesName }),
    }),
  );

  const nodeCoverageName = checkNameSchema.parse('Node Observable Coverage');
  const nodeCoverage = questHasNodeCoverageGuard({
    flows: quest.flows,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: nodeCoverageName,
      passed: nodeCoverage,
      details: nodeCoverage
        ? 'All terminal nodes have at least one observable'
        : questVerifyFailureDetailsTransformer({ quest, checkName: nodeCoverageName }),
    }),
  );

  const noDuplicateFocusFilesName = checkNameSchema.parse('No Duplicate Focus Files');
  const noDuplicateFocusFiles = questStepHasNoDuplicateFocusFilesGuard({
    steps: quest.steps,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: noDuplicateFocusFilesName,
      passed: noDuplicateFocusFiles,
      details: noDuplicateFocusFiles
        ? 'All steps have unique focusFile paths'
        : questVerifyFailureDetailsTransformer({ quest, checkName: noDuplicateFocusFilesName }),
    }),
  );

  const validAssertionsName = checkNameSchema.parse('Valid Assertions');
  const validAssertions = questStepHasValidAssertionsGuard({
    steps: quest.steps,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: validAssertionsName,
      passed: validAssertions,
      details: validAssertions
        ? 'All steps with non-Void outputContracts have at least one VALID assertion'
        : questVerifyFailureDetailsTransformer({ quest, checkName: validAssertionsName }),
    }),
  );

  const validFocusFileName = checkNameSchema.parse('Valid Focus Files');
  const validFocusFile = questStepHasValidFocusFileGuard({
    steps: quest.steps,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: validFocusFileName,
      passed: validFocusFile,
      details: validFocusFile
        ? 'All steps have focusFile paths matching known folder types'
        : questVerifyFailureDetailsTransformer({ quest, checkName: validFocusFileName }),
    }),
  );

  return checks;
};
