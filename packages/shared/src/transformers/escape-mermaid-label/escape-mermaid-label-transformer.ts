/**
 * PURPOSE: Escapes mermaid special characters in flow labels using HTML entity codes
 *
 * USAGE:
 * escapeMermaidLabelTransformer({ label: flowNodeContract.shape.label.parse('Delete failed (error)') });
 * // Returns: ContentText with parens escaped as #40; and #41;
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { FlowEdge } from '../../contracts/flow-edge/flow-edge-contract';
import type { FlowNode } from '../../contracts/flow-node/flow-node-contract';

const MERMAID_ENTITY_MAP = {
  '(': '#40;',
  ')': '#41;',
  '[': '#91;',
  ']': '#93;',
  '{': '#123;',
  '}': '#125;',
  '|': '#124;',
  '"': '#34;',
  '<': '#60;',
  '>': '#62;',
} as const;

const MERMAID_SPECIAL_CHARS = /[()[\]{}|"<>]/gu;

export const escapeMermaidLabelTransformer = ({
  label,
}: {
  label: FlowNode['label'] | NonNullable<FlowEdge['label']>;
}): ContentText =>
  contentTextContract.parse(
    label.replace(MERMAID_SPECIAL_CHARS, (char) =>
      char in MERMAID_ENTITY_MAP
        ? MERMAID_ENTITY_MAP[char as keyof typeof MERMAID_ENTITY_MAP]
        : char,
    ),
  );
