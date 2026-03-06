/**
 * PURPOSE: Converts a collected path of node IDs into fully resolved TestCaseStep objects with assertions
 *
 * USAGE:
 * flowPathToStepsTransformer({path: [{nodeId, transition: null}], nodeMap});
 * // Returns: TestCaseStep[] with assertions flattened from node observables
 */

import type { FlowNode } from '@dungeonmaster/shared/contracts';

import type { PathStep } from '../../contracts/collected-path/collected-path-contract';
import type { TestCaseStep } from '../../contracts/test-case-step/test-case-step-contract';
import { testCaseStepContract } from '../../contracts/test-case-step/test-case-step-contract';

type FlowNodeId = FlowNode['id'];

export const flowPathToStepsTransformer = ({
  path,
  nodeMap,
}: {
  path: PathStep[];
  nodeMap: Map<FlowNodeId, FlowNode>;
}): TestCaseStep[] =>
  path.map((step) => {
    const node = nodeMap.get(step.nodeId);

    const assertions = (node?.observables ?? []).map((observable) => ({
      type: observable.type,
      description: observable.description,
    }));

    return testCaseStepContract.parse({
      nodeId: step.nodeId,
      nodeLabel: node?.label ?? 'Unknown',
      nodeType: node?.type ?? 'state',
      transition: step.transition,
      assertions,
    });
  });
