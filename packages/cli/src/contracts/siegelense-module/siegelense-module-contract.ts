/**
 * PURPOSE: Validates the module namespace object `@dungeonmaster/siegelense/startup` resolves to
 * when `CliSiegelenseResponder` dynamically imports it, which carries exactly one export the CLI
 * relies on, `StartSiegelense`. Reach for this instead of an inferred cast on `dynamicImport`'s
 * `unknown` result — `z.custom` checks and hands back the original function reference unchanged,
 * unlike `z.function()`, which would wrap it in a schema-checked proxy.
 *
 * USAGE:
 * const { StartSiegelense } = siegelenseModuleContract.parse(await dynamicImport({ path: siegelensePath }));
 * await StartSiegelense({ args: ['status'] });
 */
import { z } from 'zod';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export type StartSiegelenseFn = (params: { args: readonly string[] }) => Promise<AdapterResult>;

const startSiegelenseFnContract = z.custom<StartSiegelenseFn>(
  (value) => typeof value === 'function',
  { message: 'Expected a StartSiegelense function' },
);

export const siegelenseModuleContract = z
  .object({
    StartSiegelense: startSiegelenseFnContract,
  })
  .passthrough();

export type SiegelenseModule = z.infer<typeof siegelenseModuleContract>;
