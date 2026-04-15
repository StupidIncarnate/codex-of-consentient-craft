/**
 * PURPOSE: Runs tiered structural validation checks on a quest and returns a VerifyQuestCheck array scoped to the caller's stage
 *
 * USAGE:
 * questValidateSpecTransformer({quest, scope: 'invariants'});
 * // Returns an array of { name, passed, details } check results. Scope filters which checks run:
 * //   'invariants'         — 9 save-time invariants (uniqueness, references, no raw primitives)
 * //   'flow-completeness'  — 4 flow-completeness checks (orphans, dead-ends, branching, edge labels)
 * //   'spec-completeness'  — 3 spec-completeness checks (terminal coverage, descriptions, rationale)
 */
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { verifyQuestCheckContract } from '../../contracts/verify-quest-check/verify-quest-check-contract';

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
import { questObservablesMissingDescriptionTransformer } from '../quest-observables-missing-description/quest-observables-missing-description-transformer';
import { questOrphanFlowNodesTransformer } from '../quest-orphan-flow-nodes/quest-orphan-flow-nodes-transformer';
import { questTerminalNodesMissingObservablesTransformer } from '../quest-terminal-nodes-missing-observables/quest-terminal-nodes-missing-observables-transformer';
import { questUnresolvedContractNodeRefsTransformer } from '../quest-unresolved-contract-node-refs/quest-unresolved-contract-node-refs-transformer';
import { questUnresolvedFlowRefsTransformer } from '../quest-unresolved-flow-refs/quest-unresolved-flow-refs-transformer';

type Quest = ReturnType<typeof QuestStub>;
type ValidateSpecScope = 'invariants' | 'flow-completeness' | 'spec-completeness';

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
