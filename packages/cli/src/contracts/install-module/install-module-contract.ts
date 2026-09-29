/**
 * PURPOSE: Validates the module namespace object a package's `start-install.js` dynamically
 * imports resolves to, which carries exactly one export the CLI relies on, `StartInstall`. Reach
 * for this instead of a manual duck-type check on `dynamicImport`'s `unknown` result — `z.custom`
 * checks and hands back the original function reference unchanged, unlike `z.function()`, which
 * would wrap it in a schema-checked proxy and break a test's `jest.fn()` identity.
 *
 * USAGE:
 * const parsed = installModuleContract.safeParse(await dynamicImport({ path: installPath }));
 * if (parsed.success) await parsed.data.StartInstall({ context });
 */
import { z } from '#gateway/npm/zod';
import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';

export type StartInstallFn = (params: { context: InstallContext }) => Promise<InstallResult>;

const startInstallFnContract = z.custom<StartInstallFn>((value) => typeof value === 'function', {
  message: 'Expected a StartInstall function',
});

export const installModuleContract = z
  .object({
    StartInstall: startInstallFnContract,
  })
  .loose();

export type InstallModule = z.infer<typeof installModuleContract>;
