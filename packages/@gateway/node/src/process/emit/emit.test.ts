import { emit } from './emit';
import { removeAllListeners } from '../remove-all-listeners/remove-all-listeners';

describe('emit', () => {
  it('VALID: {event with one handler, two args} => the handler receives both args and emit returns true', () => {
    const received: unknown[][] = [];
    process.on('dm-gateway-emit-event', (...args: unknown[]) => {
      received.push(args);
    });

    const heard = emit('dm-gateway-emit-event', 'first', 2);
    removeAllListeners('dm-gateway-emit-event');

    expect({ heard, received }).toStrictEqual({ heard: true, received: [['first', 2]] });
  });

  it('EMPTY: {event with no handler} => returns false', () => {
    removeAllListeners('dm-gateway-emit-event');

    const heard = emit('dm-gateway-emit-event');

    expect(heard).toBe(false);
  });

  it('VALID: {event with two handlers} => both run, in registration order', () => {
    const order: string[] = [];
    process.on('dm-gateway-emit-event', () => {
      order.push('first');
    });
    process.on('dm-gateway-emit-event', () => {
      order.push('second');
    });

    emit('dm-gateway-emit-event');
    removeAllListeners('dm-gateway-emit-event');

    expect(order).toStrictEqual(['first', 'second']);
  });
});
