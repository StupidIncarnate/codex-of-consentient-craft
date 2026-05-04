/**
 * PURPOSE: Stub factory for EventBusContext contract
 *
 * USAGE:
 * const ctx = EventBusContextStub({});
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { eventBusContextContract, type EventBusContext } from './event-bus-context-contract';

export const EventBusContextStub = ({
  ...props
}: StubArgument<EventBusContext> = {}): EventBusContext =>
  eventBusContextContract.parse({
    buses: [],
    emitterSites: [],
    subscriberFiles: [],
    ...props,
  });
