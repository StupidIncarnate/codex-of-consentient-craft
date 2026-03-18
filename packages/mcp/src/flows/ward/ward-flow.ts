/**
 * PURPOSE: Returns ToolRegistration[] for ward-related MCP tools (ward-detail)
 *
 * USAGE:
 * const registrations = WardFlow();
 * // Returns 1 ToolRegistration object that delegates to WardHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { wardDetailInputContract } from '../../contracts/ward-detail-input/ward-detail-input-contract';
import { WardHandleResponder } from '../../responders/ward/handle/ward-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const wardDetailSchema = zodToJsonSchema(wardDetailInputContract as never, jsonSchemaOptions);

export const WardFlow = (): ToolRegistration[] => [
  {
    name: 'ward-detail' as never,
    description:
      'Show detailed errors for a file in a ward run. Supports per-package path via packagePath.' as never,
    inputSchema: wardDetailSchema as never,
    handler: async ({ args }) => WardHandleResponder({ tool: 'ward-detail' as never, args }),
  },
];
