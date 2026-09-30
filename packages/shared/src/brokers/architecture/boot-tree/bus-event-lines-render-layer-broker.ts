/**
 * PURPOSE: Renders inline `bus→ <eventType>` and `bus← <busExportName>` annotation
 * lines for a single responder file in the boot tree, using the pre-computed
 * event-bus context. Returns one line per emitted event type (in source order)
 * and one line per bus the responder subscribes to (deduped). Returns `[]` when
 * the responder is neither emitter nor subscriber.
 *
 * USAGE:
 * const lines = busEventLinesRenderLayerBroker({
 *   responderFile,
 *   eventBusContext,
 * });
 *
 * WHEN-TO-USE: Inside `responderLinesRenderLayerBroker` after the existing
 * `→ adapters/...` call chain block.
 */

import type { EventBusContext } from '../../../contracts/event-bus-context/event-bus-context-contract';

export const busEventLinesRenderLayerBroker = ({
  responderFile,
  eventBusContext,
}: {
  responderFile: string;
  eventBusContext: EventBusContext;
}): string[] => {
  const lines: string[] = [];
  const responderPath = responderFile;

  // A responder may emit the same event type multiple times — show one bus→ line
  // per distinct event type, in first-seen order.
  const emittedTypes: string[] = [];
  for (const site of eventBusContext.emitterSites) {
    if (String(site.emitterFile) !== responderPath) continue;
    const alreadyAdded = emittedTypes.some((existing) => existing === String(site.eventType));
    if (!alreadyAdded) {
      emittedTypes.push(site.eventType);
    }
  }
  for (const eventType of emittedTypes) {
    lines.push(`bus→ ${eventType}`);
  }

  const subscribedBusNames: string[] = [];
  for (const sub of eventBusContext.subscriberFiles) {
    if (String(sub.subscriberFile) !== responderPath) continue;
    const alreadyAdded = subscribedBusNames.some(
      (existing) => existing === String(sub.busExportName),
    );
    if (!alreadyAdded) {
      subscribedBusNames.push(sub.busExportName);
    }
  }
  for (const busName of subscribedBusNames) {
    lines.push(`bus← ${busName} (subscribes all event types)`);
  }

  return lines;
};
