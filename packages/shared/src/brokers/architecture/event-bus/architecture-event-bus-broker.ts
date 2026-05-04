/**
 * PURPOSE: Discovers all in-process event-bus singletons in the monorepo and the
 * source files that emit to or subscribe from them. Returns a single context object
 * that the boot-tree responder renderer threads down to its inline `bus→` / `bus←`
 * annotation step.
 *
 * USAGE:
 * const ctx = architectureEventBusBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns EventBusContext with buses, emitterSites, subscriberFiles populated
 *
 * WHEN-TO-USE: Project-map composer building per-package boot trees that need to
 * render bus emit/subscribe arrows under each responder.
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  eventBusContextContract,
  type EventBusContext,
} from '../../../contracts/event-bus-context/event-bus-context-contract';
import { eventBusStatesFindLayerBroker } from './event-bus-states-find-layer-broker';
import { busEmitterSitesFindLayerBroker } from './bus-emitter-sites-find-layer-broker';
import { busSubscriberFilesFindLayerBroker } from './bus-subscriber-files-find-layer-broker';

export const architectureEventBusBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): EventBusContext => {
  const buses = eventBusStatesFindLayerBroker({ projectRoot });
  const emitterSites = busEmitterSitesFindLayerBroker({ projectRoot, buses });
  const subscriberFiles = busSubscriberFilesFindLayerBroker({ projectRoot, buses });

  return eventBusContextContract.parse({ buses, emitterSites, subscriberFiles });
};
