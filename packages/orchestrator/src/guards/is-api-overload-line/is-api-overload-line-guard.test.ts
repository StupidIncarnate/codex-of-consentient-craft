import { apiOverloadRetryStatics } from '../../statics/api-overload-retry/api-overload-retry-statics';
import { isApiOverloadLineGuard } from './is-api-overload-line-guard';

describe('isApiOverloadLineGuard', () => {
  describe('overload markers', () => {
    it.each(apiOverloadRetryStatics.markers)(
      'VALID: {line containing %s} => returns true',
      (marker) => {
        expect(isApiOverloadLineGuard({ line: `prefix ${marker} suffix` })).toBe(true);
      },
    );

    it('VALID: {verbatim Claude CLI 529 assistant text} => returns true', () => {
      const line =
        'API Error: 529 Overloaded. This is a server-side issue, usually temporary — try again in a moment.';

      expect(isApiOverloadLineGuard({ line })).toBe(true);
    });

    it('VALID: {stream-json line wrapping the synthetic error text} => returns true', () => {
      const line = JSON.stringify({
        type: 'assistant',
        isApiErrorMessage: true,
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'API Error: 529 Overloaded.' }],
        },
      });

      expect(isApiOverloadLineGuard({ line })).toBe(true);
    });
  });

  describe('non-overload lines', () => {
    it('VALID: {ordinary assistant stream line} => returns false', () => {
      const line = JSON.stringify({
        type: 'assistant',
        message: { role: 'assistant', content: [{ type: 'text', text: 'Running ward now.' }] },
      });

      expect(isApiOverloadLineGuard({ line })).toBe(false);
    });

    it('EDGE: {different API error code} => returns false', () => {
      expect(isApiOverloadLineGuard({ line: 'API Error: 401 Unauthorized' })).toBe(false);
    });

    it('EDGE: {bare 529 with no marker phrasing} => returns false', () => {
      expect(isApiOverloadLineGuard({ line: 'wrote 529 bytes' })).toBe(false);
    });

    it('EMPTY: {line: ""} => returns false', () => {
      expect(isApiOverloadLineGuard({ line: '' })).toBe(false);
    });

    it('EMPTY: {line omitted} => returns false', () => {
      expect(isApiOverloadLineGuard({})).toBe(false);
    });
  });
});
