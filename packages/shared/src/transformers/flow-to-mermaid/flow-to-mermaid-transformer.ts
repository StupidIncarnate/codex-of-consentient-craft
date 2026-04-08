/**
 * PURPOSE: Transforms a Flow into a mermaid flowchart TD diagram string
 *
 * USAGE:
 * flowToMermaidTransformer({ flow: FlowStub({ nodes: [...], edges: [...] }) });
 * // Returns: ContentText with mermaid diagram syntax
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { Flow } from '../../contracts/flow/flow-contract';
import type { FlowNode } from '../../contracts/flow-node/flow-node-contract';
import type { QuestContractEntry } from '../../contracts/quest-contract-entry/quest-contract-entry-contract';
import { collectNodeAssertionsTransformer } from '../collect-node-assertions/collect-node-assertions-transformer';
import { collectNodeContractsTransformer } from '../collect-node-contracts/collect-node-contracts-transformer';
import { escapeMermaidLabelTransformer } from '../escape-mermaid-label/escape-mermaid-label-transformer';
import { renderMermaidNodeWithAssertionsTransformer } from '../render-mermaid-node-with-assertions/render-mermaid-node-with-assertions-transformer';
import { sanitizeMermaidIdTransformer } from '../sanitize-mermaid-id/sanitize-mermaid-id-transformer';

const CROSS_FLOW_REF_PATTERN = /^.+:(.+)$/u;

const NODE_SHAPE_MAP = {
  decision: ({ id, label }: Pick<FlowNode, 'id' | 'label'>) =>
    `${sanitizeMermaidIdTransformer({ id: contentTextContract.parse(String(id)) })}{${escapeMermaidLabelTransformer({ label })}}`,
  state: ({ id, label }: Pick<FlowNode, 'id' | 'label'>) =>
    `${sanitizeMermaidIdTransformer({ id: contentTextContract.parse(String(id)) })}[${escapeMermaidLabelTransformer({ label })}]`,
  action: ({ id, label }: Pick<FlowNode, 'id' | 'label'>) =>
    `${sanitizeMermaidIdTransformer({ id: contentTextContract.parse(String(id)) })}(${escapeMermaidLabelTransformer({ label })})`,
  terminal: ({ id, label }: Pick<FlowNode, 'id' | 'label'>) =>
    `${sanitizeMermaidIdTransformer({ id: contentTextContract.parse(String(id)) })}((${escapeMermaidLabelTransformer({ label })}))`,
} as const;

export const flowToMermaidTransformer = ({
  flow,
  contracts,
}: {
  flow: Flow;
  contracts?: readonly QuestContractEntry[];
}): ContentText => {
  const lines: ContentText[] = [contentTextContract.parse('flowchart TD')];

  for (const node of flow.nodes) {
    const assertions = collectNodeAssertionsTransformer({ node });
    const nodeContracts =
      contracts === undefined
        ? []
        : collectNodeContractsTransformer({ nodeId: node.id, contracts });
    const hasContent = assertions.length > 0 || nodeContracts.length > 0;

    if (hasContent) {
      lines.push(
        contentTextContract.parse(
          `  ${renderMermaidNodeWithAssertionsTransformer({ node, assertions, contracts: nodeContracts })}`,
        ),
      );
    } else {
      const shapeRenderer = NODE_SHAPE_MAP[node.type];
      lines.push(
        contentTextContract.parse(`  ${shapeRenderer({ id: node.id, label: node.label })}`),
      );
    }
  }

  for (const edge of flow.edges) {
    const fromMatch = CROSS_FLOW_REF_PATTERN.exec(edge.from);
    const toMatch = CROSS_FLOW_REF_PATTERN.exec(edge.to);
    const from = sanitizeMermaidIdTransformer({
      id: contentTextContract.parse(fromMatch?.[1] ?? edge.from),
    });
    const to = sanitizeMermaidIdTransformer({
      id: contentTextContract.parse(toMatch?.[1] ?? edge.to),
    });

    if (edge.label === undefined) {
      lines.push(contentTextContract.parse(`  ${from} --> ${to}`));
    } else {
      lines.push(
        contentTextContract.parse(
          `  ${from} -->|${escapeMermaidLabelTransformer({ label: edge.label })}| ${to}`,
        ),
      );
    }
  }

  for (const node of flow.nodes) {
    const hasObservables = node.observables.length > 0;
    const hasNodeContracts =
      contracts !== undefined &&
      collectNodeContractsTransformer({ nodeId: node.id, contracts }).length > 0;
    const safeId = sanitizeMermaidIdTransformer({
      id: contentTextContract.parse(String(node.id)),
    });

    if (hasObservables || hasNodeContracts) {
      lines.push(contentTextContract.parse(`  style ${safeId} fill:#2d6a4f,color:#fff`));
    } else if (node.type === 'action') {
      lines.push(contentTextContract.parse(`  style ${safeId} fill:#1971c2,color:#fff`));
    } else if (node.type === 'terminal') {
      lines.push(contentTextContract.parse(`  style ${safeId} fill:#c92a2a,color:#fff`));
    }
  }

  for (const node of flow.nodes) {
    const designRefObservable = node.observables.find(
      (observable) => observable.designRef !== undefined,
    );

    if (designRefObservable !== undefined) {
      const safeId = sanitizeMermaidIdTransformer({
        id: contentTextContract.parse(String(node.id)),
      });
      lines.push(
        contentTextContract.parse(
          `  click ${safeId} href "${designRefObservable.designRef}" _blank`,
        ),
      );
    }
  }

  return contentTextContract.parse(lines.join('\n'));
};
