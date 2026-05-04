/**
 * PURPOSE: Bundles the event-bus discovery results — bus singletons, emitter sites,
 * and subscriber files — for use by the boot-tree's responder-line renderer when
 * appending inline `bus→` / `bus←` annotations.
 *
 * USAGE:
 * eventBusContextContract.parse({ buses: [...], emitterSites: [...], subscriberFiles: [...] });
 *
 * WHEN-TO-USE: Plumbing pre-computed bus discovery through `architectureBootTreeBroker`
 * into `responderLinesRenderLayerBroker` so each responder can be annotated in-line.
 */

import { z } from 'zod';
import { eventBusContract } from '../event-bus/event-bus-contract';
import { busEmitterSiteContract } from '../bus-emitter-site/bus-emitter-site-contract';
import { busSubscriberFileContract } from '../bus-subscriber-file/bus-subscriber-file-contract';

export const eventBusContextContract = z.object({
  buses: z.array(eventBusContract),
  emitterSites: z.array(busEmitterSiteContract),
  subscriberFiles: z.array(busSubscriberFileContract),
});

export type EventBusContext = z.infer<typeof eventBusContextContract>;
