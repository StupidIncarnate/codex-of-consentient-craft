import { Event } from './Event';

describe('#gateway/browser/Event', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(Event).toBe(globalThis.Event);
  });
});
