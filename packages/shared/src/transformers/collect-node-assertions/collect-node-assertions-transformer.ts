/**
 * PURPOSE: Collects and flattens all assertion descriptions from a flow node's observables with truncation
 *
 * USAGE:
 * collectNodeAssertionsTransformer({ node: FlowNodeStub({ observables: [FlowObservableStub()] }) });
 * // Returns: ContentText[] of truncated assertion descriptions
 */

import type { FlowNode } from '../../contracts/flow-node/flow-node-contract';

const ASSERTION_MAX_LENGTH = 200;

export const collectNodeAssertionsTransformer = ({ node }: { node: FlowNode }): string[] =>
  node.observables.map((observable) =>
    String(observable.description).length > ASSERTION_MAX_LENGTH
      ? `${String(observable.description).slice(0, ASSERTION_MAX_LENGTH)}...`
      : String(observable.description),
  );
