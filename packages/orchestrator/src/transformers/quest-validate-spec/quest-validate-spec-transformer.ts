/**
 * PURPOSE: Runs tiered structural validation checks on a quest and returns a VerifyQuestCheck array scoped to the caller's stage
 *
 * USAGE:
 * questValidateSpecTransformer({quest, scope: 'invariants'});
 * // Returns an array of { name, passed, details } check results. Scope filters which checks run:
 * //   'invariants'         — 13 write-time invariants that must hold on every modify-quest call,
 * //                          regardless of status (uniqueness, references, no raw primitives,
 * //                          slice prefix, focusFile uniqueness, banned matchers, companion files).
 * //                          Step-aware checks that DO live here (V1 slice prefix, V2 duplicate
 * //                          focusFile, V6 banned matchers, V9 companion files) are safe to run
 * //                          on every commit because they only inspect the steps already present.
 * //   'completeness'       — 3 whole-quest completeness invariants that ONLY make sense once a
 * //                          quest's full plan is assembled. Run by the modify-quest broker
 * //                          exclusively when the input transitions the quest into 'in_progress'.
 * //                          Includes step-contract reference resolution (V4), orphan new
 * //                          contracts (V7), and observable coverage (V8) — coverage checks that
 * //                          fire prematurely during the slice-by-slice seek_synth commits where
 * //                          minions land their slice's data one wave at a time. Gating these to
 * //                          the transition-to-in_progress moment lets minions commit incremental
 * //                          progress without the validator rejecting a half-assembled plan.
 * //   'flow-completeness'  — 4 flow-completeness checks (orphans, dead-ends, branching, edge labels)
 * //   'spec-completeness'  — 3 spec-completeness checks (terminal coverage, descriptions, rationale)
 */
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '@dungeonmaster/shared/contracts';
import { verifyQuestCheckContract } from '@dungeonmaster/shared/contracts';

import { questAssertionBannedMatchersTransformer } from '../quest-assertion-banned-matchers/quest-assertion-banned-matchers-transformer';
import { questContractRawPrimitivePropertiesTransformer } from '../quest-contract-raw-primitive-properties/quest-contract-raw-primitive-properties-transformer';
import { questDeadEndFlowNodesTransformer } from '../quest-dead-end-flow-nodes/quest-dead-end-flow-nodes-transformer';
import { questDecisionEdgesMissingLabelTransformer } from '../quest-decision-edges-missing-label/quest-decision-edges-missing-label-transformer';
import { questDecisionNodesMissingBranchesTransformer } from '../quest-decision-nodes-missing-branches/quest-decision-nodes-missing-branches-transformer';
import { questDesignDecisionsMissingRationaleTransformer } from '../quest-design-decisions-missing-rationale/quest-design-decisions-missing-rationale-transformer';
import { questDuplicateContractNamesTransformer } from '../quest-duplicate-contract-names/quest-duplicate-contract-names-transformer';
import { questDuplicateDesignDecisionIdsTransformer } from '../quest-duplicate-design-decision-ids/quest-duplicate-design-decision-ids-transformer';
import { questDuplicateFlowEdgeIdsTransformer } from '../quest-duplicate-flow-edge-ids/quest-duplicate-flow-edge-ids-transformer';
import { questDuplicateFlowIdsTransformer } from '../quest-duplicate-flow-ids/quest-duplicate-flow-ids-transformer';
import { questDuplicateFlowNodeIdsTransformer } from '../quest-duplicate-flow-node-ids/quest-duplicate-flow-node-ids-transformer';
import { questDuplicateObservableIdsInNodeTransformer } from '../quest-duplicate-observable-ids-in-node/quest-duplicate-observable-ids-in-node-transformer';
import { questDuplicateStepFocusFilesTransformer } from '../quest-duplicate-step-focus-files/quest-duplicate-step-focus-files-transformer';
import { questObservablesMissingDescriptionTransformer } from '../quest-observables-missing-description/quest-observables-missing-description-transformer';
import { questOrphanFlowNodesTransformer } from '../quest-orphan-flow-nodes/quest-orphan-flow-nodes-transformer';
import { questOrphanNewContractsTransformer } from '../quest-orphan-new-contracts/quest-orphan-new-contracts-transformer';
import { questStepCompanionFileMismatchTransformer } from '../quest-step-companion-file-mismatch/quest-step-companion-file-mismatch-transformer';
import { questStepSlicePrefixMismatchTransformer } from '../quest-step-slice-prefix-mismatch/quest-step-slice-prefix-mismatch-transformer';
import { questTerminalNodesMissingObservablesTransformer } from '../quest-terminal-nodes-missing-observables/quest-terminal-nodes-missing-observables-transformer';
import { questUnresolvedContractNodeRefsTransformer } from '../quest-unresolved-contract-node-refs/quest-unresolved-contract-node-refs-transformer';
import { questUnresolvedFlowRefsTransformer } from '../quest-unresolved-flow-refs/quest-unresolved-flow-refs-transformer';
import { questUnresolvedStepContractRefsTransformer } from '../quest-unresolved-step-contract-refs/quest-unresolved-step-contract-refs-transformer';
import { questUnsatisfiedObservablesTransformer } from '../quest-unsatisfied-observables/quest-unsatisfied-observables-transformer';

type Quest = ReturnType<typeof QuestStub>;
type ValidateSpecScope = 'invariants' | 'completeness' | 'flow-completeness' | 'spec-completeness';

const checkNameSchema = verifyQuestCheckContract.shape.name;
const checkDetailsSchema = verifyQuestCheckContract.shape.details;

export const questValidateSpecTransformer = ({
  quest,
  scope,
}: {
  quest: Quest;
  scope: ValidateSpecScope;
}): VerifyQuestCheck[] => {
  const specs: {
    name: unknown;
    offenders: unknown[];
    passDetails: unknown;
    failPrefix: unknown;
  }[] = [];

  if (scope === 'invariants') {
    specs.push(
      {
        name: 'Flow ID Uniqueness',
        offenders: questDuplicateFlowIdsTransformer({ flows: quest.flows }),
        passDetails: 'All flow IDs are unique within the quest',
        failPrefix: 'Duplicate flow ids',
      },
      {
        name: 'Flow Node ID Uniqueness',
        offenders: questDuplicateFlowNodeIdsTransformer({ flows: quest.flows }),
        passDetails: 'All node IDs are unique within each flow',
        failPrefix: 'Duplicate flow node ids',
      },
      {
        name: 'Flow Edge ID Uniqueness',
        offenders: questDuplicateFlowEdgeIdsTransformer({ flows: quest.flows }),
        passDetails: 'All edge IDs are unique within each flow',
        failPrefix: 'Duplicate flow edge ids',
      },
      {
        name: 'Observable ID Uniqueness Within Node',
        offenders: questDuplicateObservableIdsInNodeTransformer({ flows: quest.flows }),
        passDetails: 'All observable IDs are unique within each node',
        failPrefix: 'Duplicate observable ids within node',
      },
      {
        name: 'Contract Name Uniqueness',
        offenders: questDuplicateContractNamesTransformer({ contracts: quest.contracts }),
        passDetails: 'All contract names are unique within the quest',
        failPrefix: 'Duplicate contract names',
      },
      {
        name: 'Design Decision ID Uniqueness',
        offenders: questDuplicateDesignDecisionIdsTransformer({
          designDecisions: quest.designDecisions,
        }),
        passDetails: 'All design decision IDs are unique within the quest',
        failPrefix: 'Duplicate design decision ids',
      },
      {
        name: 'Valid Flow References',
        offenders: questUnresolvedFlowRefsTransformer({ flows: quest.flows }),
        passDetails:
          'All edge from/to references resolve to existing nodes (including cross-flow refs)',
        failPrefix: 'Unresolved flow refs',
      },
      {
        name: 'Contract Node Anchoring',
        offenders: questUnresolvedContractNodeRefsTransformer({
          contracts: quest.contracts,
          flows: quest.flows,
        }),
        passDetails: 'All contracts are anchored to existing flow nodes',
        failPrefix: 'Unresolved contract node refs',
      },
      {
        name: 'No Raw Primitives in Contracts',
        offenders: questContractRawPrimitivePropertiesTransformer({
          contracts: quest.contracts,
        }),
        passDetails: 'All contract properties use branded or non-primitive types',
        failPrefix: 'Raw primitive contract properties',
      },
      {
        name: 'Step Slice Prefix Match',
        offenders: questStepSlicePrefixMismatchTransformer({ steps: quest.steps }),
        passDetails: "All step IDs are prefixed with their slice's name followed by a dash",
        failPrefix: 'Step slice prefix mismatches',
      },
      {
        name: 'Step Focus File Uniqueness',
        offenders: questDuplicateStepFocusFilesTransformer({ steps: quest.steps }),
        passDetails: 'All file-anchored steps target distinct focusFile paths',
        failPrefix: 'Duplicate step focusFile paths',
      },
      {
        name: 'Assertion Banned Matchers',
        offenders: questAssertionBannedMatchersTransformer({ steps: quest.steps }),
        passDetails: 'No step assertion input/expected text contains banned jest matcher syntax',
        failPrefix: 'Assertion banned matchers',
      },
      {
        name: 'Step Companion File Completeness',
        offenders: questStepCompanionFileMismatchTransformer({ steps: quest.steps }),
        passDetails:
          'All file-anchored steps include the companion files required by their folder type',
        failPrefix: 'Step companion file mismatches',
      },
    );
  } else if (scope === 'completeness') {
    // V4, V7, V8 — whole-quest coverage checks that only fire when transitioning
    // into 'in_progress'. The broker only invokes this scope on the
    // seek_walk → in_progress transition where steps must already exist (the
    // in_progress gate-content guards check that).
    specs.push(
      {
        name: 'Step Contract References Resolve',
        offenders: questUnresolvedStepContractRefsTransformer({
          steps: quest.steps,
          contracts: quest.contracts,
        }),
        passDetails:
          'All step inputContracts and outputContracts resolve to a quest contract or Void',
        failPrefix: 'Unresolved step contract refs',
      },
      {
        name: 'New Contracts Have Creating Step',
        offenders: questOrphanNewContractsTransformer({
          contracts: quest.contracts,
          steps: quest.steps,
        }),
        passDetails: "Every contract with status 'new' is produced by at least one step",
        failPrefix: 'Orphan new contracts',
      },
      {
        name: 'Observables Are Satisfied',
        offenders: questUnsatisfiedObservablesTransformer({
          flows: quest.flows,
          steps: quest.steps,
        }),
        passDetails: 'Every flow-node observable is claimed by a step or assertion',
        failPrefix: 'Unsatisfied observables',
      },
    );
  } else if (scope === 'flow-completeness') {
    specs.push(
      {
        name: 'No Orphan Flow Nodes',
        offenders: questOrphanFlowNodesTransformer({ flows: quest.flows }),
        passDetails: 'All flow nodes are connected to at least one edge',
        failPrefix: 'Orphan flow nodes',
      },
      {
        name: 'No Dead-End Non-Terminal Nodes',
        offenders: questDeadEndFlowNodesTransformer({ flows: quest.flows }),
        passDetails: 'All non-terminal nodes have at least one outgoing edge',
        failPrefix: 'Dead-end non-terminal nodes',
      },
      {
        name: 'Decision Node Branching',
        offenders: questDecisionNodesMissingBranchesTransformer({ flows: quest.flows }),
        passDetails: 'All decision nodes have at least 2 outgoing edges',
        failPrefix: 'Decision nodes missing branches',
      },
      {
        name: 'Decision Edge Labels',
        offenders: questDecisionEdgesMissingLabelTransformer({ flows: quest.flows }),
        passDetails: 'All edges leaving decision nodes have labels',
        failPrefix: 'Decision edges missing label',
      },
    );
  } else {
    specs.push(
      {
        name: 'Terminal Node Observable Coverage',
        offenders: questTerminalNodesMissingObservablesTransformer({ flows: quest.flows }),
        passDetails: 'All terminal nodes have at least one observable',
        failPrefix: 'Terminal nodes missing observables',
      },
      {
        name: 'Observable Descriptions',
        offenders: questObservablesMissingDescriptionTransformer({ flows: quest.flows }),
        passDetails: 'All observables have non-empty descriptions',
        failPrefix: 'Observables missing description',
      },
      {
        name: 'Design Decision Rationale',
        offenders: questDesignDecisionsMissingRationaleTransformer({
          designDecisions: quest.designDecisions,
        }),
        passDetails: 'All design decisions have a non-empty rationale',
        failPrefix: 'Design decisions missing rationale',
      },
    );
  }

  const checks: VerifyQuestCheck[] = [];
  for (const spec of specs) {
    const passed = spec.offenders.length === 0;
    const detailsText = passed
      ? String(spec.passDetails)
      : `${String(spec.failPrefix)}: ${spec.offenders.map((item) => String(item)).join('; ')}`;
    checks.push(
      verifyQuestCheckContract.parse({
        name: checkNameSchema.parse(String(spec.name)),
        passed,
        details: checkDetailsSchema.parse(detailsText),
      }),
    );
  }

  return checks;
};
