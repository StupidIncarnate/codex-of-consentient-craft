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
import { collectNodeAssertionsTransformer } from '../collect-node-assertions/collect-node-assertions-transformer';
import { escapeMermaidLabelTransformer } from '../escape-mermaid-label/escape-mermaid-label-transformer';
import { renderMermaidNodeWithAssertionsTransformer } from '../render-mermaid-node-with-assertions/render-mermaid-node-with-assertions-transformer';

const CROSS_FLOW_REF_PATTERN = /^.+:(.+)$/u;

const NODE_SHAPE_MAP = {
  decision: ({ id, label }: Pick<FlowNode, 'id' | 'label'>) =>
    `${id}{${escapeMermaidLabelTransformer({ label })}}`,
  state: ({ id, label }: Pick<FlowNode, 'id' | 'label'>) =>
    `${id}[${escapeMermaidLabelTransformer({ label })}]`,
  action: ({ id, label }: Pick<FlowNode, 'id' | 'label'>) =>
    `${id}(${escapeMermaidLabelTransformer({ label })})`,
  terminal: ({ id, label }: Pick<FlowNode, 'id' | 'label'>) =>
    `${id}((${escapeMermaidLabelTransformer({ label })}))`,
} as const;

export const flowToMermaidTransformer = ({ flow }: { flow: Flow }): ContentText => {
  const lines: ContentText[] = [contentTextContract.parse('flowchart TD')];

  for (const node of flow.nodes) {
    const assertions = collectNodeAssertionsTransformer({ node });

    if (assertions.length > 0) {
      lines.push(
        contentTextContract.parse(
          `  ${renderMermaidNodeWithAssertionsTransformer({ node, assertions })}`,
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
    const from = fromMatch?.[1] ?? edge.from;
    const to = toMatch?.[1] ?? edge.to;

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

    if (hasObservables) {
      lines.push(contentTextContract.parse(`  style ${node.id} fill:#2d6a4f,color:#fff`));
    } else if (node.type === 'action') {
      lines.push(contentTextContract.parse(`  style ${node.id} fill:#1971c2,color:#fff`));
    } else if (node.type === 'terminal') {
      lines.push(contentTextContract.parse(`  style ${node.id} fill:#c92a2a,color:#fff`));
    }
  }

  for (const node of flow.nodes) {
    const designRefObservable = node.observables.find(
      (observable) => observable.designRef !== undefined,
    );

    if (designRefObservable !== undefined) {
      lines.push(
        contentTextContract.parse(
          `  click ${node.id} href "${designRefObservable.designRef}" _blank`,
        ),
      );
    }
  }

  return contentTextContract.parse(lines.join('\n'));
};
