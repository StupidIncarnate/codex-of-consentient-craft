/**
 * PURPOSE: Runs the subset of structural guards applicable to a quest spec (before step generation) and builds a structured checks array
 *
 * USAGE:
 * questValidateSpecTransformer({quest});
 * // Returns array of { name, passed, details } check results covering flows, observables, contracts, and design decisions
 */
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { verifyQuestCheckContract } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { questContractHasNoRawPrimitivesGuard } from '../../guards/quest-contract-has-no-raw-primitives/quest-contract-has-no-raw-primitives-guard';
import { questContractNamesUniqueGuard } from '../../guards/quest-contract-names-unique/quest-contract-names-unique-guard';
import { questContractNodeIdResolvesGuard } from '../../guards/quest-contract-node-id-resolves/quest-contract-node-id-resolves-guard';
import { questDesignDecisionHasRationaleGuard } from '../../guards/quest-design-decision-has-rationale/quest-design-decision-has-rationale-guard';
import { questDesignDecisionIdsUniqueGuard } from '../../guards/quest-design-decision-ids-unique/quest-design-decision-ids-unique-guard';
import { questFlowDecisionEdgesLabeledGuard } from '../../guards/quest-flow-decision-edges-labeled/quest-flow-decision-edges-labeled-guard';
import { questFlowDecisionHasBranchesGuard } from '../../guards/quest-flow-decision-has-branches/quest-flow-decision-has-branches-guard';
import { questFlowEdgeIdsUniqueGuard } from '../../guards/quest-flow-edge-ids-unique/quest-flow-edge-ids-unique-guard';
import { questFlowHasRequiredFieldsGuard } from '../../guards/quest-flow-has-required-fields/quest-flow-has-required-fields-guard';
import { questFlowIdsUniqueGuard } from '../../guards/quest-flow-ids-unique/quest-flow-ids-unique-guard';
import { questFlowNoDeadEndsGuard } from '../../guards/quest-flow-no-dead-ends/quest-flow-no-dead-ends-guard';
import { questFlowNodeIdsUniqueGuard } from '../../guards/quest-flow-node-ids-unique/quest-flow-node-ids-unique-guard';
import { questHasNodeCoverageGuard } from '../../guards/quest-has-node-coverage/quest-has-node-coverage-guard';
import { questHasNoOrphanFlowNodesGuard } from '../../guards/quest-has-no-orphan-flow-nodes/quest-has-no-orphan-flow-nodes-guard';
import { questHasValidFlowRefsGuard } from '../../guards/quest-has-valid-flow-refs/quest-has-valid-flow-refs-guard';
import { questObservableHasDescriptionGuard } from '../../guards/quest-observable-has-description/quest-observable-has-description-guard';
import { questObservableIdsUniqueInNodeGuard } from '../../guards/quest-observable-ids-unique-in-node/quest-observable-ids-unique-in-node-guard';
import { questStepHasFocusTargetGuard } from '../../guards/quest-step-has-focus-target/quest-step-has-focus-target-guard';

type Quest = ReturnType<typeof QuestStub>;

const checkNameSchema = verifyQuestCheckContract.shape.name;
const checkDetailsSchema = verifyQuestCheckContract.shape.details;

export const questValidateSpecTransformer = ({ quest }: { quest: Quest }): VerifyQuestCheck[] => {
  const checks: VerifyQuestCheck[] = [];

  // Check 1: Flow has required fields (id, name, flowType, entryPoint, at least one exitPoint)
  // Check 3: Every flow has flowType set to a valid enum value (subset of required fields check)
  const flowRequiredFieldsPassed = questFlowHasRequiredFieldsGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Flow Required Fields'),
      passed: flowRequiredFieldsPassed,
      details: checkDetailsSchema.parse(
        flowRequiredFieldsPassed
          ? 'Every flow has id, name, flowType, entryPoint, and at least one exitPoint'
          : 'One or more flows are missing a required field (id, name, flowType, entryPoint, or exitPoints)',
      ),
    }),
  );

  // Check 2 (Flow ID is kebab-case and unique): the kebab-case half is enforced at parse time by
  //   flowIdContract (`.regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)` in packages/shared/src/contracts/flow-id/
  //   flow-id-contract.ts). questGetBroker parses the quest JSON with flowContract before this transformer
  //   runs, so a malformed flow ID would fail parsing and never reach here. The uniqueness half is enforced
  //   here by questFlowIdsUniqueGuard (Zod cannot express intra-quest uniqueness).
  const flowIdsUniquePassed = questFlowIdsUniqueGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Flow ID Uniqueness'),
      passed: flowIdsUniquePassed,
      details: checkDetailsSchema.parse(
        flowIdsUniquePassed
          ? 'All flow IDs are unique within the quest'
          : 'One or more flows share the same id',
      ),
    }),
  );

  // Check 4 (Node type valid enum): enforced at parse time by flowNodeTypeContract
  //   (`z.enum(['state','decision','action','terminal'])` in packages/shared/src/contracts/flow-node-type/
  //   flow-node-type-contract.ts). Parsing rejects any invalid type, so a dedicated guard would be dead code.
  //
  // Check 5 (Node ID kebab-case): enforced at parse time by flowNodeIdContract
  //   (`.regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)` in packages/shared/src/contracts/flow-node-id/
  //   flow-node-id-contract.ts). Dead code as a separate guard.
  //
  // Check 6: Node IDs are unique within a flow
  const flowNodeIdsUniquePassed = questFlowNodeIdsUniqueGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Flow Node ID Uniqueness'),
      passed: flowNodeIdsUniquePassed,
      details: checkDetailsSchema.parse(
        flowNodeIdsUniquePassed
          ? 'All node IDs are unique within each flow'
          : 'One or more flows contain duplicate node IDs',
      ),
    }),
  );

  // Check 7: Every non-entry node is reachable from the entry point (no orphan nodes)
  const noOrphanFlowNodesPassed = questHasNoOrphanFlowNodesGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('No Orphan Flow Nodes'),
      passed: noOrphanFlowNodesPassed,
      details: checkDetailsSchema.parse(
        noOrphanFlowNodesPassed
          ? 'All flow nodes are connected to at least one edge'
          : 'One or more flow nodes are orphaned (not referenced by any edge)',
      ),
    }),
  );

  // Check 8: No dead-end non-terminal nodes
  const noDeadEndsPassed = questFlowNoDeadEndsGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('No Dead-End Non-Terminal Nodes'),
      passed: noDeadEndsPassed,
      details: checkDetailsSchema.parse(
        noDeadEndsPassed
          ? 'All non-terminal nodes have at least one outgoing edge'
          : 'One or more non-terminal nodes have zero outgoing edges (dead ends that should be terminal)',
      ),
    }),
  );

  // Check 9: Decision nodes have at least 2 outgoing edges
  const decisionBranchesPassed = questFlowDecisionHasBranchesGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Decision Node Branching'),
      passed: decisionBranchesPassed,
      details: checkDetailsSchema.parse(
        decisionBranchesPassed
          ? 'All decision nodes have at least 2 outgoing edges'
          : 'One or more decision nodes have fewer than 2 outgoing edges',
      ),
    }),
  );

  // Check 10: Decision node outgoing edges have labels
  const decisionEdgesLabeledPassed = questFlowDecisionEdgesLabeledGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Decision Edge Labels'),
      passed: decisionEdgesLabeledPassed,
      details: checkDetailsSchema.parse(
        decisionEdgesLabeledPassed
          ? 'All edges leaving decision nodes have labels'
          : 'One or more edges leaving decision nodes are missing a label',
      ),
    }),
  );

  // Check 11: Every terminal node has at least one observable
  const nodeCoveragePassed = questHasNodeCoverageGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Terminal Node Observable Coverage'),
      passed: nodeCoveragePassed,
      details: checkDetailsSchema.parse(
        nodeCoveragePassed
          ? 'All terminal nodes have at least one observable'
          : 'One or more terminal nodes have no observables',
      ),
    }),
  );

  // Check 12 (Edge has ID field): enforced at parse time by flowEdgeContract
  //   (`id: flowEdgeIdContract` is a required field in packages/shared/src/contracts/flow-edge/
  //   flow-edge-contract.ts). Missing edge IDs would fail Zod parsing upstream, so a dedicated guard would
  //   never fire.
  //
  // Check 13: Edge IDs are unique within the flow
  const flowEdgeIdsUniquePassed = questFlowEdgeIdsUniqueGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Flow Edge ID Uniqueness'),
      passed: flowEdgeIdsUniquePassed,
      details: checkDetailsSchema.parse(
        flowEdgeIdsUniquePassed
          ? 'All edge IDs are unique within each flow'
          : 'One or more flows contain duplicate edge IDs',
      ),
    }),
  );

  // Check 14: Every edge's from/to references an existing node in the same flow
  // Check 15: Cross-flow edge references resolve to existing flow and node
  const validFlowRefsPassed = questHasValidFlowRefsGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Valid Flow References'),
      passed: validFlowRefsPassed,
      details: checkDetailsSchema.parse(
        validFlowRefsPassed
          ? 'All edge from/to references resolve to existing nodes (including cross-flow refs)'
          : 'One or more edges reference non-existent nodes or unresolved cross-flow refs',
      ),
    }),
  );

  // Check 16 (Observable type valid enum): enforced at parse time by outcomeTypeContract
  //   (`z.enum([...12 values...])` in packages/shared/src/contracts/outcome-type/outcome-type-contract.ts)
  //   referenced by flowObservableContract. An invalid type would fail parsing. Dead code as a separate guard.
  //
  // Check 17: Every observable has a non-empty description
  const observableHasDescriptionPassed = questObservableHasDescriptionGuard({ flows: quest.flows });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Observable Descriptions'),
      passed: observableHasDescriptionPassed,
      details: checkDetailsSchema.parse(
        observableHasDescriptionPassed
          ? 'All observables have non-empty descriptions'
          : 'One or more observables are missing a description',
      ),
    }),
  );

  // Check 18 (Observable ID kebab-case): enforced at parse time by observableIdContract
  //   (`.regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)` in packages/shared/src/contracts/observable-id/
  //   observable-id-contract.ts). Dead code as a separate guard.
  //
  // Check 19: Observable IDs are unique within the node they live on
  const observableIdsUniqueInNodePassed = questObservableIdsUniqueInNodeGuard({
    flows: quest.flows,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Observable ID Uniqueness Within Node'),
      passed: observableIdsUniqueInNodePassed,
      details: checkDetailsSchema.parse(
        observableIdsUniqueInNodePassed
          ? 'All observable IDs are unique within each node'
          : 'One or more nodes contain duplicate observable IDs',
      ),
    }),
  );

  // Check 20 (Contract has nodeId field): enforced at parse time by questContractEntryContract
  //   (`nodeId: flowNodeIdContract.describe(...)` — NOT `.optional()` — in packages/shared/src/contracts/
  //   quest-contract-entry/quest-contract-entry-contract.ts). A contract without a nodeId would fail parsing.
  //   Dead code as a separate guard.
  //
  // Check 21: Every contract's nodeId resolves to an existing node
  const contractNodeIdResolvesPassed = questContractNodeIdResolvesGuard({
    contracts: quest.contracts,
    flows: quest.flows,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Contract Node Anchoring'),
      passed: contractNodeIdResolvesPassed,
      details: checkDetailsSchema.parse(
        contractNodeIdResolvesPassed
          ? 'All contracts are anchored to existing flow nodes'
          : 'One or more contracts are orphaned (nodeId points to a non-existent or deleted node)',
      ),
    }),
  );

  // Check 22: Contract names are unique within the quest
  const contractNamesUniquePassed = questContractNamesUniqueGuard({ contracts: quest.contracts });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Contract Name Uniqueness'),
      passed: contractNamesUniquePassed,
      details: checkDetailsSchema.parse(
        contractNamesUniquePassed
          ? 'All contract names are unique within the quest'
          : 'One or more contracts share the same name',
      ),
    }),
  );

  // Check 23: Contracts don't use raw primitives
  const noRawPrimitivesPassed = questContractHasNoRawPrimitivesGuard({
    contracts: quest.contracts,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('No Raw Primitives in Contracts'),
      passed: noRawPrimitivesPassed,
      details: checkDetailsSchema.parse(
        noRawPrimitivesPassed
          ? 'All contract properties use branded or non-primitive types'
          : 'One or more contract properties use raw primitives (string, number, etc.)',
      ),
    }),
  );

  // Check 24: Design decision IDs are unique within the quest
  const designDecisionIdsUniquePassed = questDesignDecisionIdsUniqueGuard({
    designDecisions: quest.designDecisions,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Design Decision ID Uniqueness'),
      passed: designDecisionIdsUniquePassed,
      details: checkDetailsSchema.parse(
        designDecisionIdsUniquePassed
          ? 'All design decision IDs are unique within the quest'
          : 'One or more design decisions share the same id',
      ),
    }),
  );

  // Check 25: Every design decision has a non-empty rationale
  const designDecisionHasRationalePassed = questDesignDecisionHasRationaleGuard({
    designDecisions: quest.designDecisions,
  });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Design Decision Rationale'),
      passed: designDecisionHasRationalePassed,
      details: checkDetailsSchema.parse(
        designDecisionHasRationalePassed
          ? 'All design decisions have a non-empty rationale'
          : 'One or more design decisions are missing a rationale',
      ),
    }),
  );

  // Check 26: Every step has exactly one of focusFile or focusAction (XOR)
  const stepFocusTargetPassed = questStepHasFocusTargetGuard({ steps: quest.steps });
  checks.push(
    verifyQuestCheckContract.parse({
      name: checkNameSchema.parse('Step Focus Target'),
      passed: stepFocusTargetPassed,
      details: checkDetailsSchema.parse(
        stepFocusTargetPassed
          ? 'All steps have exactly one of focusFile or focusAction'
          : 'One or more steps have neither or both focusFile and focusAction',
      ),
    }),
  );

  return checks;
};
