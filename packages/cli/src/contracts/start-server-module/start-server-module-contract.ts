/**
 * PURPOSE: Validates the module namespace object `@dungeonmaster/server`'s entry resolves to when
 * `CliServeResponder` dynamically imports it, which carries exactly one export the CLI relies on,
 * `StartServer`. Reach for this instead of an inferred cast on `dynamicImport`'s `unknown` result —
 * `z.custom` checks and hands back the original function reference unchanged, unlike `z.function()`,
 * which would wrap it in a schema-checked proxy.
 *
 * USAGE:
 * const { StartServer } = startServerModuleContract.parse(await dynamicImport({ path: serverPath }));
 * StartServer({ serveWebBundle: true });
 */
import { z } from 'zod';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export type StartServerFn = (args?: { serveWebBundle?: boolean }) => AdapterResult;

const startServerFnContract = z.custom<StartServerFn>((value) => typeof value === 'function', {
  message: 'Expected a StartServer function',
});

export const startServerModuleContract = z
  .object({
    StartServer: startServerFnContract,
  })
  .passthrough();

export type StartServerModule = z.infer<typeof startServerModuleContract>;
