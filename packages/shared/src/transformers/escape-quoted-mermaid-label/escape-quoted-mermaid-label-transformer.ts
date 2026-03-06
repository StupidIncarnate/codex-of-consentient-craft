/**
 * PURPOSE: Escapes mermaid special characters in quoted flow labels using HTML entities for quotes
 *
 * USAGE:
 * escapeQuotedMermaidLabelTransformer({ label: flowNodeContract.shape.label.parse('Show "error"') });
 * // Returns: ContentText with quotes escaped as &quot; instead of #34;
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { FlowEdge } from '../../contracts/flow-edge/flow-edge-contract';
import type { FlowNode } from '../../contracts/flow-node/flow-node-contract';

const QUOTED_MERMAID_ENTITY_MAP = {
  '(': '#40;',
  ')': '#41;',
  '[': '#91;',
  ']': '#93;',
  '{': '#123;',
  '}': '#125;',
  '|': '#124;',
  '"': '&quot;',
} as const;

const MERMAID_SPECIAL_CHARS = /[()[\]{}|"]/gu;

export const escapeQuotedMermaidLabelTransformer = ({
  label,
}: {
  label: FlowNode['label'] | NonNullable<FlowEdge['label']>;
}): ContentText =>
  contentTextContract.parse(
    label.replace(MERMAID_SPECIAL_CHARS, (char) =>
      char in QUOTED_MERMAID_ENTITY_MAP
        ? QUOTED_MERMAID_ENTITY_MAP[char as keyof typeof QUOTED_MERMAID_ENTITY_MAP]
        : char,
    ),
  );
