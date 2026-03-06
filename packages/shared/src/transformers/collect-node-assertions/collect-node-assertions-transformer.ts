/**
 * PURPOSE: Collects and flattens all assertion descriptions from a flow node's observables with truncation
 *
 * USAGE:
 * collectNodeAssertionsTransformer({ node: FlowNodeStub({ observables: [FlowObservableStub()] }) });
 * // Returns: ContentText[] of truncated assertion descriptions
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { FlowNode } from '../../contracts/flow-node/flow-node-contract';

const ASSERTION_MAX_LENGTH = 200;

export const collectNodeAssertionsTransformer = ({ node }: { node: FlowNode }): ContentText[] =>
  node.observables.map((observable) =>
    contentTextContract.parse(
      String(observable.description).length > ASSERTION_MAX_LENGTH
        ? `${String(observable.description).slice(0, ASSERTION_MAX_LENGTH)}...`
        : String(observable.description),
    ),
  );
