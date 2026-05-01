import { matchesWidgetFileNameGuard } from './matches-widget-file-name-guard';

describe('matchesWidgetFileNameGuard', () => {
  describe('valid widget files', () => {
    it('VALID: {name: quest-chat-widget.tsx} => returns true', () => {
      expect(matchesWidgetFileNameGuard({ name: 'quest-chat-widget.tsx' })).toBe(true);
    });

    it('VALID: {name: user-card-widget.ts} => returns true', () => {
      expect(matchesWidgetFileNameGuard({ name: 'user-card-widget.ts' })).toBe(true);
    });

    it('VALID: {name: stub-widget.tsx} => returns true', () => {
      expect(matchesWidgetFileNameGuard({ name: 'stub-widget.tsx' })).toBe(true);
    });
  });

  describe('non-widget files', () => {
    it('VALID: {name: quest-chat-widget.proxy.tsx} => returns false', () => {
      expect(matchesWidgetFileNameGuard({ name: 'quest-chat-widget.proxy.tsx' })).toBe(false);
    });

    it('VALID: {name: quest-chat-widget.test.tsx} => returns false', () => {
      expect(matchesWidgetFileNameGuard({ name: 'quest-chat-widget.test.tsx' })).toBe(false);
    });

    it('VALID: {name: use-data-binding.ts} => returns false', () => {
      expect(matchesWidgetFileNameGuard({ name: 'use-data-binding.ts' })).toBe(false);
    });

    it('VALID: {name: widget-utils.ts} => returns false', () => {
      expect(matchesWidgetFileNameGuard({ name: 'widget-utils.ts' })).toBe(false);
    });

    it('EMPTY: {name: undefined} => returns false', () => {
      expect(matchesWidgetFileNameGuard({})).toBe(false);
    });
  });
});
