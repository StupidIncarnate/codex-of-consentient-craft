/**
 * PURPOSE: Defines the types used by domain flows and the lifecycle flow for tool registration
 *
 * USAGE:
 * const registration: ToolRegistration = { name: 'discover', description: '...', inputSchema: {...}, handler: async ({ args }) => response };
 * // ToolRegistration combines Zod-validated data fields with a handler function
 */
import { z } from 'zod';

import { toolDescriptionContract } from '../tool-description/tool-description-contract';
import { toolNameContract } from '../tool-name/tool-name-contract';
import type { ToolResponse } from '../tool-response/tool-response-contract';

export type ToolHandler = ({ args }: { args: Record<string, unknown> }) => Promise<ToolResponse>;

export const toolRegistrationContract = z.object({
  name: toolNameContract,
  description: toolDescriptionContract,
  inputSchema: z.record(z.string().brand<'InputSchemaKey'>(), z.unknown()),
});

export type ToolRegistration = z.infer<typeof toolRegistrationContract> & {
  handler: ToolHandler;
};
