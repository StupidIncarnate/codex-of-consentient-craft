/**
 * PURPOSE: Validates the module namespace object a package's `start-install.js` or
 * `start-install-finalize.js` dynamically imports resolves to. Each carries one of two OPTIONAL
 * install exports, `StartInstall` or `StartInstallFinalize`, and the caller picks the one it
 * needs. Reach for this instead of a manual duck-type check on `dynamicImport`'s `unknown`
 * result — `z.custom` checks and hands back the original function reference unchanged, unlike
 * `z.function()`, which would wrap it in a schema-checked proxy and break a test's `jest.fn()`
 * identity.
 *
 * USAGE:
 * const parsed = installModuleContract.safeParse(await dynamicImport({ path: installPath }));
 * const startInstall = parsed.success ? parsed.data.StartInstall : undefined;
 */
import { z } from '#gateway/npm/zod';
import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';

export type StartInstallFn = (params: { context: InstallContext }) => Promise<InstallResult>;

const startInstallFnContract = z.custom<StartInstallFn>((value) => typeof value === 'function', {
  message: 'Expected a StartInstall function',
});

const startInstallFinalizeFnContract = z.custom<StartInstallFn>(
  (value) => typeof value === 'function',
  { message: 'Expected a StartInstallFinalize function' },
);

export const installModuleContract = z
  .object({
    StartInstall: startInstallFnContract.optional(),
    StartInstallFinalize: startInstallFinalizeFnContract.optional(),
  })
  .loose()
  .brand<'InstallModule'>();

export type InstallModule = z.infer<typeof installModuleContract>;
