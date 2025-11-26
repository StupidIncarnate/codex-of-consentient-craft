/**
 * PURPOSE: Validates TypeScript NodeFactory for AST transformers
 *
 * USAGE:
 * import type { TypescriptNodeFactory } from './typescript-node-factory-contract';
 * // Use as opaque type passed between adapters
 */

import { z } from 'zod';

export const typescriptNodeFactoryContract = z.unknown().brand<'TypescriptNodeFactory'>();

export type TypescriptNodeFactory = z.infer<typeof typescriptNodeFactoryContract>;
