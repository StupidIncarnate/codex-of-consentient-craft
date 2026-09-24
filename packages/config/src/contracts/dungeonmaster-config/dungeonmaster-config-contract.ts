/**
 * PURPOSE: Validates dungeonmaster configuration structure for projects
 *
 * USAGE:
 * import {dungeonmasterConfigContract} from './dungeonmaster-config-contract';
 * const config = dungeonmasterConfigContract.parse({framework: 'react', schema: 'zod'});
 * // Returns validated DungeonmasterConfig type
 */

import { z } from 'zod';
import { networkPortContract, orchestrationModeContract } from '@dungeonmaster/shared/contracts';
import { configDefaultsStatics } from '../../statics/config-defaults/config-defaults-statics';
import { frameworkStatics } from '../../statics/framework/framework-statics';
import { routingLibraryStatics } from '../../statics/routing-library/routing-library-statics';
import { schemaLibraryStatics } from '../../statics/schema-library/schema-library-statics';

export const dungeonmasterConfigContract = z
  .object({
    framework: z.enum(frameworkStatics.frameworks.all),
    orchestrationMode: orchestrationModeContract.default(
      configDefaultsStatics.orchestrationMode.default,
    ),
    routing: z.enum(routingLibraryStatics.libraries.all).optional(),
    schema: z.union([
      z.enum(schemaLibraryStatics.libraries.all),
      z.array(z.enum(schemaLibraryStatics.libraries.all)),
    ]),
    architecture: z
      .object({
        overrides: z
          .record(
            z.string().brand<'FolderName'>(),
            z.object({ add: z.array(z.string().brand<'PackageName'>()).optional() }),
          )
          .optional(),
        allowedRootFiles: z.array(z.string().brand<'FileName'>()).optional(),
        booleanFunctionPrefixes: z.array(z.string().brand<'FunctionPrefix'>()).optional(),
      })
      .optional(),
    orchestration: z
      .object({
        slotCount: z
          .number()
          .int()
          .min(configDefaultsStatics.orchestration.slotCount.min)
          .max(configDefaultsStatics.orchestration.slotCount.max)
          .default(configDefaultsStatics.orchestration.slotCount.default)
          .brand<'SlotCount'>(),
        timeoutMs: z
          .number()
          .int()
          .min(configDefaultsStatics.orchestration.timeoutMs.min)
          .default(configDefaultsStatics.orchestration.timeoutMs.default)
          .brand<'TimeoutMs'>(),
      })
      .optional(),
    ward: z
      .object({
        concurrency: z
          .number()
          .int()
          .min(configDefaultsStatics.ward.concurrency.min)
          .max(configDefaultsStatics.ward.concurrency.max)
          .default(configDefaultsStatics.ward.concurrency.default)
          .brand<'WardConcurrency'>(),
      })
      .optional(),
    dungeonmaster: z
      .object({
        port: networkPortContract.optional(),
      })
      .optional(),
    devServer: z
      .object({
        devCommand: z.string().min(1).brand<'DevCommand'>(),
        port: z
          .number()
          .int()
          .min(configDefaultsStatics.devServer.port.min)
          .max(configDefaultsStatics.devServer.port.max)
          .brand<'DevServerPort'>(),
        // The port a BROWSER loads the app from, when that is not `port`. A project whose dev
        // command starts an API and a bundler serves the API on `port` and the app somewhere else —
        // this repo's vite binds `portResolveBroker() + 1` and proxies `/api` and `/ws` back — so
        // the one URL a hands-on QA session is handed has to be this one, not the API origin.
        // Optional, and absent means the app IS on `port`, which is the single-server shape.
        webPort: z
          .number()
          .int()
          .min(configDefaultsStatics.devServer.port.min)
          .max(configDefaultsStatics.devServer.port.max)
          .brand<'DevServerWebPort'>()
          .optional(),
        buildCommand: z
          .string()
          .min(1)
          .default(configDefaultsStatics.devServer.buildCommand)
          .brand<'BuildCommand'>(),
        readinessPath: z
          .string()
          .default(configDefaultsStatics.devServer.readinessPath)
          .brand<'ReadinessPath'>(),
        readinessTimeoutMs: z
          .number()
          .int()
          .min(configDefaultsStatics.devServer.readinessTimeoutMs.min)
          .default(configDefaultsStatics.devServer.readinessTimeoutMs.default)
          .brand<'ReadinessTimeoutMs'>(),
        // Boots a consumer's own app for siegelense/Playwright, the way THAT repo's own e2e setup
        // boots it — not dungeonmaster's own server. Absent means no e2e lane is configured yet.
        e2e: z
          .object({
            processes: z
              .array(
                z.object({
                  // 'api' | 'web' by convention — an open string so a single-server app's spec
                  // still validates with only one process.
                  name: z.string().min(1).brand<'E2eProcessName'>(),
                  // A complete, already-composed, NO-WATCH shell command — may reference the same
                  // {apiPort}/{webPort}/{apiWorkspace}/{webWorkspace} tokens
                  // lanePlaceholderSubstituteTransformer substitutes at boot time. A free-form
                  // string spawned through a shell, exactly like Playwright's own webServer.command.
                  command: z.string().min(1).brand<'E2eCommand'>(),
                  portRole: z.enum(['api', 'web']),
                  readyPath: z.string().min(1).brand<'ReadinessPath'>(),
                  // Per-process env, so a fake CLI (Claude/ward) is wired here rather than assumed
                  // from the caller's shell — the orchestrator's own siege lanes set no such vars.
                  // Values take the same placeholder tokens as `command`; a relative value resolves
                  // against the repo root.
                  env: z
                    .record(
                      z.string().brand<'E2eEnvVarName'>(),
                      z.string().brand<'E2eEnvVarValue'>(),
                    )
                    .optional(),
                }),
              )
              .min(1),
          })
          .optional(),
      })
      .optional(),
  })
  .refine(
    (config) => {
      const dmPort = config.dungeonmaster?.port;
      const devPort = config.devServer?.port;
      if (dmPort === undefined || devPort === undefined) return true;
      return Number(dmPort) !== Number(devPort);
    },
    {
      message:
        'dungeonmaster.port and devServer.port must differ — siege will kill the parent server otherwise',
      path: ['dungeonmaster', 'port'],
    },
  );

export type DungeonmasterConfig = z.infer<typeof dungeonmasterConfigContract>;

type DevServerE2eProcesses = NonNullable<
  NonNullable<DungeonmasterConfig['devServer']>['e2e']
>['processes'];

// One entry of devServer.e2e.processes — the shape siegelense's spec-derive broker reads and the
// shape InstallCreateConfigResponder seeds as a placeholder.
export type DevServerE2eProcess = DevServerE2eProcesses extends readonly (infer U)[] ? U : never;
