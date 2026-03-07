/**
 * PURPOSE: Renders a mermaid node with HTML-formatted assertions in a quoted label
 *
 * USAGE:
 * renderMermaidNodeWithAssertionsTransformer({ node: FlowNodeStub(), assertions: ['shows dialog'] });
 * // Returns: ContentText like 'id["<b>Label</b><br/><small>· shows dialog</small>"]'
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { FlowNode } from '../../contracts/flow-node/flow-node-contract';
import { escapeQuotedMermaidLabelTransformer } from '../escape-quoted-mermaid-label/escape-quoted-mermaid-label-transformer';

const SHAPE_DELIMITERS = {
  state: { open: '[', close: ']' },
  decision: { open: '{', close: '}' },
  action: { open: '(', close: ')' },
  terminal: { open: '((', close: '))' },
} as const;

export const renderMermaidNodeWithAssertionsTransformer = ({
  node,
  assertions,
}: {
  node: FlowNode;
  assertions: ContentText[];
}): ContentText => {
  const delimiters = SHAPE_DELIMITERS.state;
  const escapedLabel = escapeQuotedMermaidLabelTransformer({ label: node.label });
  const assertionLines = assertions
    .map(
      (assertion) =>
        `<br/><small>· ${escapeQuotedMermaidLabelTransformer({ label: assertion })}</small>`,
    )
    .join('');

  return contentTextContract.parse(
    `${node.id}${delimiters.open}"<b>${escapedLabel}</b>${assertionLines}"${delimiters.close}`,
  );
};
