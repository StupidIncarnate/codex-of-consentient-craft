/**
 * PURPOSE: Seeds a harness observable into the first terminal node missing one when the quest status requires terminal-observable coverage
 *
 * USAGE:
 * questFlowObservableSeedTransformer({ flows, status: 'review_observables' });
 * // Returns flows (possibly with an injected harness observable on the first terminal node missing observables)
 *
 * WHEN-TO-USE: Building quest JSON for E2E seeding where terminal-observable coverage is required by the status
 * WHEN-NOT-TO-USE: Production code — the injected observable is harness data
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';
import { flowObservableContract, questStatusContract } from '@dungeonmaster/shared/contracts';

import { questFlowObservableSeedStatics } from '../../statics/quest-flow-observable-seed/quest-flow-observable-seed-statics';

type FlowInput = Record<PropertyKey, unknown>;

const TERMINAL_OBSERVABLE_REQUIRED_STATUSES: Readonly<Partial<Record<QuestStatus, true>>> = {
  review_observables: true,
};

export const questFlowObservableSeedTransformer = ({
  flows,
  status,
}: {
  flows: FlowInput[];
  status: string;
}): FlowInput[] => {
  const parseResult = questStatusContract.safeParse(status);
  if (!parseResult.success) {
    return flows;
  }
  const requiresTerminalObservable = TERMINAL_OBSERVABLE_REQUIRED_STATUSES[parseResult.data];
  if (requiresTerminalObservable === undefined) {
    return flows;
  }

  const flowHasTerminalObservable = flows.some((flow: FlowInput) => {
    const nodes: unknown = flow.nodes;
    if (!Array.isArray(nodes)) {
      return false;
    }
    return nodes.some((node: unknown) => {
      if (typeof node !== 'object' || node === null) {
        return false;
      }
      const nodeRecord = node as Record<PropertyKey, unknown>;
      const nodeType: unknown = nodeRecord.type;
      const observables: unknown = nodeRecord.observables;
      return nodeType === 'terminal' && Array.isArray(observables) && observables.length > 0;
    });
  });

  if (flowHasTerminalObservable) {
    return flows;
  }

  const alreadyInjected = { value: false };
  return flows.map((flow: FlowInput): FlowInput => {
    const nodes: unknown = flow.nodes;
    if (!Array.isArray(nodes)) {
      return flow;
    }
    const newNodes: unknown[] = nodes.map((node: unknown): unknown => {
      if (alreadyInjected.value) {
        return node;
      }
      if (typeof node !== 'object' || node === null) {
        return node;
      }
      const nodeRecord = node as Record<PropertyKey, unknown>;
      if (nodeRecord.type !== 'terminal') {
        return node;
      }
      alreadyInjected.value = true;
      const existingObservables: unknown = nodeRecord.observables;
      const existing: unknown[] = Array.isArray(existingObservables) ? existingObservables : [];
      return {
        ...node,
        observables: [
          ...existing,
          flowObservableContract.parse({ ...questFlowObservableSeedStatics.observable }),
        ],
      };
    });
    return { ...flow, nodes: newNodes };
  });
};
