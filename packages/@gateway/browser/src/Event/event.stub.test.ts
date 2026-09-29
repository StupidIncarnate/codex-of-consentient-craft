import { Event } from './Event';
import { EventStub } from './event.stub';

describe('EventStub', () => {
  it('VALID: {given fields} => a real Event carrying them', () => {
    const event = EventStub({ type: 'click' });

    expect({ isEvent: event instanceof Event, type: event.type }).toStrictEqual({
      isEvent: true,
      type: 'click',
    });
  });

  it('VALID: {} => the documented defaults', () => {
    const event = EventStub();

    expect(event.type).toBe('visibilitychange');
  });
});
