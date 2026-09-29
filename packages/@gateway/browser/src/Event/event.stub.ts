/// <reference lib="dom" />
/**
 * PURPOSE: A real `Event` instance built through the environment's own constructor or factory —
 * for a caller staging `#gateway/browser/Event`'s value without hand-typing a fake one.
 *
 * USAGE:
 * const value = EventStub();
 */
import { Event } from './Event';

export const EventStub = ({ type = 'visibilitychange' }: { type?: string } = {}): Event =>
  new Event(type);
