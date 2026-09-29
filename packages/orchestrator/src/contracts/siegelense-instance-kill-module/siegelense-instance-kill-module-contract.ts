/**
 * PURPOSE: Validates the module namespace object `@dungeonmaster/siegelense/brokers` resolves to
 * when `laneKillBroker` dynamically imports it — the orchestrator cannot depend on
 * `@dungeonmaster/siegelense` directly (it is a cycle) — which carries the one export that broker
 * relies on, `instanceKillBroker`. Reach for this instead of an inferred cast on `dynamicImport`'s
 * `unknown` result — `z.custom` checks and hands back the original function reference unchanged,
 * unlike `z.function()`, which would wrap it in a schema-checked proxy.
 *
 * USAGE:
 * const { instanceKillBroker } = siegelenseInstanceKillModuleContract.parse(await dynamicImport({ path }));
 * await instanceKillBroker({ instanceId: 'inst_7f3a9c21' });
 */
import { z } from '#gateway/npm/zod';

export type InstanceKillBrokerFn = (params: { instanceId: string }) => Promise<unknown>;

const instanceKillBrokerFnContract = z.custom<InstanceKillBrokerFn>(
  (value) => typeof value === 'function',
  { message: 'Expected an instanceKillBroker function' },
);

export const siegelenseInstanceKillModuleContract = z
  .object({
    instanceKillBroker: instanceKillBrokerFnContract,
  })
  .loose();

export type SiegelenseInstanceKillModule = z.infer<typeof siegelenseInstanceKillModuleContract>;
