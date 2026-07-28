/**
 * PURPOSE: Renders a batch of persisted quest comments into the markdown message the agent reads —
 * one block per comment, naming the flow, the box id, and the box label/description read off the
 * quest's flows, since the browser sends only ids and text, never labels.
 *
 * USAGE:
 * commentBatchToMarkdownTransformer({comments: quest.comments, flows: quest.flows});
 * // Returns PromptText — one block per comment joined by a '---' divider line ('\n\n---\n\n').
 * // Only the comments passed in are rendered; nothing else is read or replayed.
 */
import type {
  Flow,
  FlowId,
  FlowNode,
  FlowNodeId,
  FlowObservable,
  ObservableId,
  QuestComment,
} from '@dungeonmaster/shared/contracts';

import { promptTextContract } from '../../contracts/prompt-text/prompt-text-contract';
import type { PromptText } from '../../contracts/prompt-text/prompt-text-contract';

export const commentBatchToMarkdownTransformer = ({
  comments,
  flows,
}: {
  comments: QuestComment[];
  flows: Flow[];
}): PromptText => {
  const flowsById = new Map<FlowId, Flow>();
  const nodesByFlowId = new Map<FlowId, Map<FlowNodeId, FlowNode>>();
  const observablesByFlowAndNodeId = new Map<
    FlowId,
    Map<FlowNodeId, Map<ObservableId, FlowObservable>>
  >();

  for (const flow of flows) {
    flowsById.set(flow.id, flow);

    const nodesById = new Map<FlowNodeId, FlowNode>();
    const observablesByNodeId = new Map<FlowNodeId, Map<ObservableId, FlowObservable>>();

    for (const node of flow.nodes) {
      nodesById.set(node.id, node);

      const observableById = new Map<ObservableId, FlowObservable>();
      for (const observable of node.observables) {
        observableById.set(observable.id, observable);
      }
      observablesByNodeId.set(node.id, observableById);
    }

    nodesByFlowId.set(flow.id, nodesById);
    observablesByFlowAndNodeId.set(flow.id, observablesByNodeId);
  }

  const blocks = comments.map((comment) => {
    const flowName = flowsById.get(comment.flowId)?.name ?? comment.flowId;
    const nodeLabel =
      nodesByFlowId.get(comment.flowId)?.get(comment.nodeId)?.label ?? comment.nodeId;

    if (comment.observableId === undefined) {
      return (
        `Flow "${flowName}" / node \`${comment.nodeId}\` ("${nodeLabel}")\n` +
        `User Comment: ${comment.text}`
      );
    }

    const description =
      observablesByFlowAndNodeId.get(comment.flowId)?.get(comment.nodeId)?.get(comment.observableId)
        ?.description ?? comment.observableId;

    return (
      `Flow "${flowName}" / observable \`${comment.observableId}\` ("${description}") on node \`${comment.nodeId}\`\n` +
      `User Comment: ${comment.text}`
    );
  });

  return promptTextContract.parse(blocks.join('\n\n---\n\n'));
};
