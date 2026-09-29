/**
 * PURPOSE: Proxy for reportBinProgramSpawnLayerBroker
 *
 * USAGE:
 * reportBinProgramSpawnLayerBrokerProxy();
 *
 * WHEN-TO-USE: Composes resolveSpawnedProgramLayerBrokerProxy (enforce-proxy-child-creation) — the
 * layer itself only calls `ctx.report()`, which the test stages directly via RuleContextStub's
 * jest.fn() report, with nothing else to mock.
 */
import { resolveSpawnedProgramLayerBrokerProxy } from './resolve-spawned-program-layer-broker.proxy';

export const reportBinProgramSpawnLayerBrokerProxy = (): Record<PropertyKey, never> => {
  resolveSpawnedProgramLayerBrokerProxy();

  return {};
};
