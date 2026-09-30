/**
 * PURPOSE: Defines the output schema returned by the MCP get-server-config tool — used by slash commands to point the browser at the running server
 *
 * USAGE:
 * getServerConfigOutputContract.parse({ baseUrl: 'http://localhost:3737', port: 3737 });
 * // Returns: validated GetServerConfigOutput
 */
import { z } from '#gateway/npm/zod';

export const getServerConfigOutputContract = z
  .object({
    baseUrl: z
      .url()
      .brand<'GetServerConfigOutputBaseUrl'>()
      .describe(
        'Full base URL the dungeonmaster server is listening on (e.g. http://localhost:3737)',
      ),
    port: z
      .number()
      .int()
      .min(1)
      .max(65_535)
      .brand<'GetServerConfigOutputPort'>()
      .describe('Numeric port the server is bound to'),
  })
  .strict()
  .brand<'GetServerConfigOutput'>();

export type GetServerConfigOutput = z.infer<typeof getServerConfigOutputContract>;
