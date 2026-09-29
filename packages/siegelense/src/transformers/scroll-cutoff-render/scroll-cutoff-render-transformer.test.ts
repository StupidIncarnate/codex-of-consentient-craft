import { ScrollReadingStub } from '../../contracts/scroll-reading/scroll-reading.stub';
import { scrollCutoffRenderTransformer } from './scroll-cutoff-render-transformer';

describe('scrollCutoffRenderTransformer', () => {
  describe('a page that fits', () => {
    it('EMPTY: {page equals viewport} => returns null', () => {
      const reading = ScrollReadingStub();

      expect(scrollCutoffRenderTransformer({ reading })).toBe(null);
    });
  });

  describe('content below or beside the viewport', () => {
    it('VALID: {900px page, 500px viewport, scrollY 0} => names the 400px below', () => {
      const reading = ScrollReadingStub({ scrollHeight: 900, viewportHeight: 500 });

      expect(scrollCutoffRenderTransformer({ reading })).toBe(
        'CUT OFF — page 900px tall; 400px below the viewport',
      );
    });

    it('VALID: {1200px page, 1000px viewport, scrollX 0} => names the 200px to the right', () => {
      const reading = ScrollReadingStub({ scrollWidth: 1200, viewportWidth: 1000 });

      expect(scrollCutoffRenderTransformer({ reading })).toBe(
        'CUT OFF — page 1200px wide; 200px right of the viewport',
      );
    });

    it('VALID: {overflow on both axes} => names both, height first', () => {
      const reading = ScrollReadingStub({
        scrollWidth: 1200,
        viewportWidth: 1000,
        scrollHeight: 900,
        viewportHeight: 500,
      });

      expect(scrollCutoffRenderTransformer({ reading })).toBe(
        'CUT OFF — page 900px tall; 400px below the viewport; page 1200px wide; 200px right of the viewport',
      );
    });
  });

  describe('a scrolled page', () => {
    it('VALID: {scrolled 400 into a 900px page, 500px viewport} => names 400px above and none below', () => {
      const reading = ScrollReadingStub({
        scrollY: 400,
        scrollHeight: 900,
        viewportHeight: 500,
      });

      expect(scrollCutoffRenderTransformer({ reading })).toBe(
        'CUT OFF — page 900px tall; 400px above the viewport',
      );
    });

    it('VALID: {scrolled 100 into a 900px page, 500px viewport} => names above and below', () => {
      const reading = ScrollReadingStub({
        scrollY: 100,
        scrollHeight: 900,
        viewportHeight: 500,
      });

      expect(scrollCutoffRenderTransformer({ reading })).toBe(
        'CUT OFF — page 900px tall; 100px above the viewport; 300px below the viewport',
      );
    });

    it('VALID: {scrolled 50 right into a 1200px page, 1000px viewport} => names left and right', () => {
      const reading = ScrollReadingStub({
        scrollX: 50,
        scrollWidth: 1200,
        viewportWidth: 1000,
      });

      expect(scrollCutoffRenderTransformer({ reading })).toBe(
        'CUT OFF — page 1200px wide; 50px left of the viewport; 150px right of the viewport',
      );
    });
  });
});
