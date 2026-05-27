/**
 * PURPOSE: Defines the output schema returned by the MCP get-server-config tool — used by slash commands to point the browser at the running server
 *
 * USAGE:
 * getServerConfigOutputContract.parse({ baseUrl: 'http://localhost:3737', port: 3737 });
 * // Returns: validated GetServerConfigOutput
 */
import { z } from 'zod';

import { networkPortContract } from '@dungeonmaster/shared/contracts';

export const getServerConfigOutputContract = z
  .object({
    baseUrl: z
      .string()
      .url()
      .brand<'BaseUrl'>()
      .describe(
        'Full base URL the dungeonmaster server is listening on (e.g. http://localhost:3737)',
      ),
    port: networkPortContract.describe('Numeric port the server is bound to'),
  })
  .strict();

export type GetServerConfigOutput = z.infer<typeof getServerConfigOutputContract>;
