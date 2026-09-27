/**
 * PURPOSE: A real `EventEmitter` instance, constructed through `#gateway/node/events`'s own
 * pass-through — for a caller that needs a genuine emitter rather than a hand-typed stand-in.
 *
 * USAGE:
 * const emitter = EventEmitterStub();
 * emitter.on('ping', () => { ... });
 * emitter.emit('ping');
 */
import EventEmitter from './events';

export const EventEmitterStub = (): EventEmitter => new EventEmitter();
