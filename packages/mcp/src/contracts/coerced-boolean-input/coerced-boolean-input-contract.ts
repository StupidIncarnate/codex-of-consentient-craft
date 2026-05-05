/**
 * PURPOSE: Boolean schema that also accepts the literal strings "true" and "false". MCP
 * transport clients (notably Claude Code) sometimes stringify boolean tool arguments
 * before sending the JSON-RPC request, so MCP tool input contracts that need a boolean
 * field use this in place of z.boolean().
 *
 * USAGE:
 * verbose: coercedBooleanInputContract.brand<'Verbose'>().describe('...').optional();
 * // Accepts true, false, "true", "false"; rejects everything else (other strings, numbers, null).
 */
import { z } from 'zod';

export const coercedBooleanInputContract = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export type CoercedBooleanInput = z.infer<typeof coercedBooleanInputContract>;
