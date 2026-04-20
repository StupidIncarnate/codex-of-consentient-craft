/**
 * PURPOSE: Seeds a harness observable into the first terminal node missing one when the quest status requires terminal-observable coverage
 *
 * USAGE:
 * questFlowObservableSeedTransformer({ flows, status: 'review_observables' });
 * // Returns flows (possibly with an injected FlowObservableStub on the first terminal node missing observables)
 *
 * WHEN-TO-USE: Building quest JSON for E2E seeding where terminal-observable coverage is required by the status
 * WHEN-NOT-TO-USE: Production code — the injected observable is a harness stub
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';
import { FlowObservableStub, questStatusContract } from '@dungeonmaster/shared/contracts';

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
    const nodes: unknown = Reflect.get(flow, 'nodes');
    if (!Array.isArray(nodes)) {
      return false;
    }
    return nodes.some((node: unknown) => {
      if (typeof node !== 'object' || node === null) {
        return false;
      }
      const nodeType: unknown = Reflect.get(node, 'type');
      const observables: unknown = Reflect.get(node, 'observables');
      return nodeType === 'terminal' && Array.isArray(observables) && observables.length > 0;
    });
  });

  if (flowHasTerminalObservable) {
    return flows;
  }

  const alreadyInjected = { value: false };
  return flows.map((flow: FlowInput): FlowInput => {
    const nodes: unknown = Reflect.get(flow, 'nodes');
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
      if (Reflect.get(node, 'type') !== 'terminal') {
        return node;
      }
      alreadyInjected.value = true;
      const existingObservables: unknown = Reflect.get(node, 'observables');
      const existing: unknown[] = Array.isArray(existingObservables) ? existingObservables : [];
      return {
        ...node,
        observables: [
          ...existing,
          FlowObservableStub({
            id: 'harness-terminal-observable' as never,
            description: 'harness-seeded observable' as never,
          }),
        ],
      };
    });
    return { ...flow, nodes: newNodes };
  });
};
