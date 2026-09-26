/**
 * PURPOSE: Proxy for resolveStaticStringLayerBroker
 *
 * USAGE:
 * resolveStaticStringLayerBrokerProxy();
 *
 * WHEN-TO-USE: Composes findModuleConstInitLayerBrokerProxy (enforce-proxy-child-creation) — the
 * layer itself is a pure AST walk with no I/O boundary of its own to mock.
 */
import { findModuleConstInitLayerBrokerProxy } from './find-module-const-init-layer-broker.proxy';

export const resolveStaticStringLayerBrokerProxy = (): Record<PropertyKey, never> => {
  findModuleConstInitLayerBrokerProxy();

  return {};
};
