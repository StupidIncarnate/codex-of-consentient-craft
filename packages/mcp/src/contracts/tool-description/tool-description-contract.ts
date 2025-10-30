/**
 * PURPOSE: Defines a branded string type for MCP tool descriptions
 *
 * USAGE:
 * const description: ToolDescription = toolDescriptionContract.parse('Discover utilities, brokers, standards across the codebase');
 * // Returns a branded ToolDescription string type
 */
import { z } from 'zod';

export const toolDescriptionContract = z.string().brand<'ToolDescription'>();

export type ToolDescription = z.infer<typeof toolDescriptionContract>;
