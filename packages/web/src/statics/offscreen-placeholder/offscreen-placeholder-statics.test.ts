import { offscreenPlaceholderStatics } from './offscreen-placeholder-statics';
import { stickyHeaderStatics } from '../sticky-header/sticky-header-statics';

describe('offscreenPlaceholderStatics', () => {
  describe('heights', () => {
    it('VALID: {heights} => returns the reserved height for each skipped entry kind', () => {
      expect(offscreenPlaceholderStatics.heights).toStrictEqual({
        toolRow: 25,
        chatMessage: 400,
      });
    });

    it('VALID: {heights.toolRow} => equals the height a collapsed tool row pins at', () => {
      expect(offscreenPlaceholderStatics.heights.toolRow).toBe(stickyHeaderStatics.heights.toolRow);
    });
  });
});
