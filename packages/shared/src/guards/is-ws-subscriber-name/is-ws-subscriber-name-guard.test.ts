import { isWsSubscriberNameGuard } from './is-ws-subscriber-name-guard';

describe('isWsSubscriberNameGuard', () => {
  describe('matching names', () => {
    it('VALID: {name: EventsOn suffix} => returns true', () => {
      expect(isWsSubscriberNameGuard({ name: 'orchestratorEventsOnAdapter' })).toBe(true);
    });

    it('VALID: {name: OutboxWatch suffix} => returns true', () => {
      expect(isWsSubscriberNameGuard({ name: 'outboxWatchAdapter' })).toBe(true);
    });

    it('VALID: {name: Subscribe infix} => returns true', () => {
      expect(isWsSubscriberNameGuard({ name: 'wsSubscribeAdapter' })).toBe(true);
    });

    it('VALID: {name: events-on kebab form} => returns true', () => {
      expect(isWsSubscriberNameGuard({ name: 'orchestrator-events-on-adapter' })).toBe(true);
    });

    it('VALID: {name: outbox-watch kebab form} => returns true', () => {
      expect(isWsSubscriberNameGuard({ name: 'orchestrator-outbox-watch-adapter' })).toBe(true);
    });
  });

  describe('non-matching names', () => {
    it('VALID: {name: regular adapter} => returns false', () => {
      expect(isWsSubscriberNameGuard({ name: 'questStartAdapter' })).toBe(false);
    });

    it('VALID: {name: regular responder} => returns false', () => {
      expect(isWsSubscriberNameGuard({ name: 'questStartResponder' })).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {name: undefined} => returns false', () => {
      expect(isWsSubscriberNameGuard({})).toBe(false);
    });

    it('EMPTY: {name: empty string} => returns false', () => {
      expect(isWsSubscriberNameGuard({ name: '' })).toBe(false);
    });
  });
});
