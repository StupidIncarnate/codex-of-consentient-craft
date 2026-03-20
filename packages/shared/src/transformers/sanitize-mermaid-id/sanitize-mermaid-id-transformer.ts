/**
 * PURPOSE: Prefixes mermaid-reserved keywords in node IDs to prevent parse errors
 *
 * USAGE:
 * sanitizeMermaidIdTransformer({ id: contentTextContract.parse('end-node') });
 * // Returns: ContentText '_end-node' (prefixed because 'end' is reserved in mermaid)
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

const MERMAID_RESERVED_PATTERN =
  /^(?:end|subgraph|graph|flowchart|style|linkstyle|classdef|class|click|direction|default)(?:-|_|$)/iu;

export const sanitizeMermaidIdTransformer = ({ id }: { id: ContentText }): ContentText =>
  contentTextContract.parse(MERMAID_RESERVED_PATTERN.test(id) ? `_${id}` : id);
