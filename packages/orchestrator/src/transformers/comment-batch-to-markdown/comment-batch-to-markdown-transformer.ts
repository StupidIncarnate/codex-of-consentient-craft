/**
 * PURPOSE: Renders a batch of persisted quest comments into the markdown message the agent reads —
 * one block per comment, naming the flow, the box id, and the box label/description read off the
 * quest's flows, since the browser sends only ids and text, never labels.
 *
 * USAGE:
 * commentBatchToMarkdownTransformer({comments: quest.comments, flows: quest.flows});
 * // Returns PromptText — one block per comment joined by a '---' divider line ('\n\n---\n\n').
 * // Only the comments passed in are rendered; nothing else is read or replayed.
 * // A comment whose own text holds a line reading exactly '---' UNDER A BLANK LINE has that line
 * // escaped to '\---', so it cannot forge a block boundary and strand its tail without a context
 * // line. Every other '---' in the text is left byte-identical.
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

// The rule line that separates one comment's block from the next, and the full sequence the
// blocks are joined on.
const DIVIDER_RULE = '---';
const BLOCK_DIVIDER = `\n\n${DIVIDER_RULE}\n\n`;
// A comment's text is embedded verbatim into its block, so a divider-forming rule line inside
// that text would forge a boundary indistinguishable from a real one — and the tail after it
// would reach the agent as a block with no context line, i.e. feedback attributed to the wrong
// box. Escaping keeps the rule visible and literal (`\---` renders as the characters `---`), so
// the divider stays `---` and there is still exactly one per gap.
const ESCAPED_DIVIDER_RULE = `\\${DIVIDER_RULE}`;

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

    // Only a line that could actually FORGE the divider is escaped, and that is narrower than
    // "any line reading `---`": the sequence is '\n\n---\n\n', so the rule line must have a BLANK
    // line before it. A `---` directly under real content cannot produce it, and neither can the
    // text's first line, which is embedded after `User Comment: ` and so is never a bare line.
    // Everything else — `3---5`, a trailing `---`, a four-dash `----` rule, a `---` under a
    // sentence — passes through byte-identical, because mangling text that was never dangerous is
    // its own defect.
    const lines = comment.text.split('\n');
    const text = lines
      .map((line, index) =>
        line === DIVIDER_RULE && index > 0 && lines[index - 1] === '' ? ESCAPED_DIVIDER_RULE : line,
      )
      .join('\n');

    if (comment.observableId === undefined) {
      return (
        `Flow "${flowName}" / node \`${comment.nodeId}\` ("${nodeLabel}")\n` +
        `User Comment: ${text}`
      );
    }

    const description =
      observablesByFlowAndNodeId.get(comment.flowId)?.get(comment.nodeId)?.get(comment.observableId)
        ?.description ?? comment.observableId;

    return (
      `Flow "${flowName}" / observable \`${comment.observableId}\` ("${description}") on node \`${comment.nodeId}\`\n` +
      `User Comment: ${text}`
    );
  });

  return promptTextContract.parse(blocks.join(BLOCK_DIVIDER));
};
