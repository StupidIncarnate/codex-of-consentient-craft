import { EventEmitterStub } from './event-emitter.stub';

describe('EventEmitterStub', () => {
  it('VALID: {} => is a real EventEmitter that dispatches a registered listener', () => {
    const emitter = EventEmitterStub();
    const received: string[] = [];
    emitter.on('ping', (value: string) => {
      received.push(value);
    });

    emitter.emit('ping', 'pong');

    expect(received).toStrictEqual(['pong']);
  });
});
