/**
 * PURPOSE: One entry of `devServer.e2e.processes` — the shape siegelense's lane-spec derive broker
 * reads off a resolved `.dungeonmaster.json`, and the shape `InstallCreateConfigResponder` seeds as
 * a placeholder. Split out of `dungeonmasterConfigContract` so a cross-package test can build one
 * through `DevServerE2eProcessStub` — parsed and branded — instead of hand-asserting an object
 * literal against `DevServerE2eProcess`'s branded fields.
 *
 * USAGE:
 * devServerE2eProcessContract.parse({
 *   name: 'api', command: 'npm run dev:no-watch', portRole: 'api', readyPath: '/',
 * });
 * // Returns a branded DevServerE2eProcess
 */

import { z } from 'zod';

export const devServerE2eProcessContract = z.object({
  // 'api' | 'web' by convention — an open string so a single-server app's spec still validates
  // with only one process.
  name: z.string().min(1).brand<'E2eProcessName'>(),
  // A complete, already-composed, NO-WATCH shell command — may reference the same
  // {apiPort}/{webPort}/{apiWorkspace}/{webWorkspace} tokens lanePlaceholderSubstituteTransformer
  // substitutes at boot time. A free-form string spawned through a shell, exactly like Playwright's
  // own webServer.command.
  command: z.string().min(1).brand<'E2eCommand'>(),
  portRole: z.enum(['api', 'web']),
  readyPath: z.string().min(1).brand<'ReadinessPath'>(),
  // Per-process env, so a fake CLI (Claude/ward) is wired here rather than assumed from the
  // caller's shell — the orchestrator's own siege lanes set no such vars. Values take the same
  // placeholder tokens as `command`; a relative value resolves against the repo root.
  env: z
    .record(z.string().brand<'E2eEnvVarName'>(), z.string().brand<'E2eEnvVarValue'>())
    .optional(),
});

export type DevServerE2eProcess = z.infer<typeof devServerE2eProcessContract>;
