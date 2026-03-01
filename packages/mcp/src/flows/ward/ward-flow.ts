/**
 * PURPOSE: Returns ToolRegistration[] for ward-related MCP tools (ward-list, ward-detail, ward-raw)
 *
 * USAGE:
 * const registrations = WardFlow();
 * // Returns 3 ToolRegistration objects that delegate to WardHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { wardDetailInputContract } from '../../contracts/ward-detail-input/ward-detail-input-contract';
import { wardListInputContract } from '../../contracts/ward-list-input/ward-list-input-contract';
import { wardRawInputContract } from '../../contracts/ward-raw-input/ward-raw-input-contract';
import { WardHandleResponder } from '../../responders/ward/handle/ward-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const wardListSchema = zodToJsonSchema(wardListInputContract as never, jsonSchemaOptions);
const wardDetailSchema = zodToJsonSchema(wardDetailInputContract as never, jsonSchemaOptions);
const wardRawSchema = zodToJsonSchema(wardRawInputContract as never, jsonSchemaOptions);

export const WardFlow = (): ToolRegistration[] => [
  {
    name: 'ward-list' as never,
    description:
      'List errors by file from a ward run. Supports per-package path via packagePath.' as never,
    inputSchema: wardListSchema as never,
    handler: async ({ args }) => WardHandleResponder({ tool: 'ward-list' as never, args }),
  },
  {
    name: 'ward-detail' as never,
    description:
      'Show detailed errors for a file in a ward run. Supports per-package path via packagePath.' as never,
    inputSchema: wardDetailSchema as never,
    handler: async ({ args }) => WardHandleResponder({ tool: 'ward-detail' as never, args }),
  },
  {
    name: 'ward-raw' as never,
    description:
      'Show raw tool output from a ward run. Supports per-package path via packagePath.' as never,
    inputSchema: wardRawSchema as never,
    handler: async ({ args }) => WardHandleResponder({ tool: 'ward-raw' as never, args }),
  },
];
