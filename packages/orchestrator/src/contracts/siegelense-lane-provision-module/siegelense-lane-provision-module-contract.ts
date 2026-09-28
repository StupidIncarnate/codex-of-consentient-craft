/**
 * PURPOSE: Validates the module namespace object `@dungeonmaster/siegelense/brokers` resolves to
 * when `laneProvisionBatchBroker` dynamically imports it — the orchestrator cannot depend on
 * `@dungeonmaster/siegelense` directly (it is a cycle) — which carries the two exports that broker
 * relies on, `capacityReadBroker` and `instanceStartBroker`, pulled off the SAME resolved module so
 * both calls key the identical mocked path in a test. Reach for this instead of an inferred cast on
 * `dynamicImport`'s `unknown` result — `z.custom` checks and hands back each function reference
 * unchanged, unlike `z.function()`, which would wrap it in a schema-checked proxy.
 *
 * USAGE:
 * const { capacityReadBroker, instanceStartBroker } =
 *   siegelenseLaneProvisionModuleContract.parse(await dynamicImport({ path }));
 * await capacityReadBroker({ specName: 'default', poolSize: null });
 */
import { z } from 'zod';

export type CapacityReadBrokerFn = (params: {
  specName: string;
  poolSize: number | null;
}) => Promise<unknown>;
export type InstanceStartBrokerFn = (params: {
  specName: string;
  questId: string | null;
  guildId: string | null;
  seed: string | null;
}) => Promise<unknown>;

const capacityReadBrokerFnContract = z.custom<CapacityReadBrokerFn>(
  (value) => typeof value === 'function',
  { message: 'Expected a capacityReadBroker function' },
);
const instanceStartBrokerFnContract = z.custom<InstanceStartBrokerFn>(
  (value) => typeof value === 'function',
  { message: 'Expected an instanceStartBroker function' },
);

export const siegelenseLaneProvisionModuleContract = z
  .object({
    capacityReadBroker: capacityReadBrokerFnContract,
    instanceStartBroker: instanceStartBrokerFnContract,
  })
  .loose();

export type SiegelenseLaneProvisionModule = z.infer<typeof siegelenseLaneProvisionModuleContract>;
