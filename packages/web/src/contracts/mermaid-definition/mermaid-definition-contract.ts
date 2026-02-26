/**
 * PURPOSE: Defines a branded string type for mermaid diagram definition syntax
 *
 * USAGE:
 * mermaidDefinitionContract.parse('graph TD; A-->B');
 * // Returns: MermaidDefinition branded string
 */

import { z } from 'zod';

export const mermaidDefinitionContract = z.string().min(1).brand<'MermaidDefinition'>();

export type MermaidDefinition = z.infer<typeof mermaidDefinitionContract>;
