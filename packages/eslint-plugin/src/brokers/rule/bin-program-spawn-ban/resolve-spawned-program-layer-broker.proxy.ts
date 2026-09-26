/**
 * PURPOSE: Proxy for resolveSpawnedProgramLayerBroker
 *
 * USAGE:
 * resolveSpawnedProgramLayerBrokerProxy();
 *
 * WHEN-TO-USE: Composes resolveStaticStringLayerBrokerProxy (enforce-proxy-child-creation) — the
 * layer itself is a pure string/AST reduction with no I/O boundary of its own to mock.
 */
import { resolveStaticStringLayerBrokerProxy } from './resolve-static-string-layer-broker.proxy';

export const resolveSpawnedProgramLayerBrokerProxy = (): Record<PropertyKey, never> => {
  resolveStaticStringLayerBrokerProxy();

  return {};
};
