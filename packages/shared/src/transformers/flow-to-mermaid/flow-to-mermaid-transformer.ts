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

const CROSS_FLOW_REF_PATTERN = /^.+:(.+)$/u;

const NODE_SHAPE_MAP = {
  decision: ({ id, label }: { id: string; label: string }) => `${id}{${label}}`,
  state: ({ id, label }: { id: string; label: string }) => `${id}[${label}]`,
  action: ({ id, label }: { id: string; label: string }) => `${id}(${label})`,
  terminal: ({ id, label }: { id: string; label: string }) => `${id}((${label}))`,
} as const;

export const flowToMermaidTransformer = ({ flow }: { flow: Flow }): ContentText => {
  const lines: ContentText[] = [contentTextContract.parse('flowchart TD')];

  for (const node of flow.nodes) {
    const shapeRenderer = NODE_SHAPE_MAP[node.type];
    lines.push(contentTextContract.parse(`  ${shapeRenderer({ id: node.id, label: node.label })}`));
  }

  for (const edge of flow.edges) {
    const fromMatch = CROSS_FLOW_REF_PATTERN.exec(edge.from);
    const toMatch = CROSS_FLOW_REF_PATTERN.exec(edge.to);
    const from = fromMatch?.[1] ?? edge.from;
    const to = toMatch?.[1] ?? edge.to;

    if (edge.label === undefined) {
      lines.push(contentTextContract.parse(`  ${from} --> ${to}`));
    } else {
      lines.push(contentTextContract.parse(`  ${from} -->|${edge.label}| ${to}`));
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
