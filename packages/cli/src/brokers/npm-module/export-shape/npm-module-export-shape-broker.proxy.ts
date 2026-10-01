/**
 * PURPOSE: Empty proxy for npmModuleExportShapeBroker — its only reads are the TypeScript
 * compiler's own module resolution and declaration read, which run real against installed packages.
 *
 * USAGE:
 * npmModuleExportShapeBrokerProxy();
 * // No setup methods
 */

import { npmModuleEsmOnlyBrokerProxy } from '../esm-only/npm-module-esm-only-broker.proxy';
import { runtimeDefaultLayerBrokerProxy } from './runtime-default-layer-broker.proxy';

export const npmModuleExportShapeBrokerProxy = (): Record<PropertyKey, never> => {
  npmModuleEsmOnlyBrokerProxy();
  runtimeDefaultLayerBrokerProxy();
  return {};
};
