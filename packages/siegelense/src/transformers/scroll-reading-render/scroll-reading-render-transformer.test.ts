import { ScrollReadingStub } from '../../contracts/scroll-reading/scroll-reading.stub';
import { scrollReadingRenderTransformer } from './scroll-reading-render-transformer';

describe('scrollReadingRenderTransformer', () => {
  it('VALID: {scrolled 400 down a 900px page in a 500px viewport} => reports position, sizes and max scroll', () => {
    const reading = ScrollReadingStub({ scrollY: 400, scrollHeight: 900, viewportHeight: 500 });

    expect(scrollReadingRenderTransformer({ reading })).toBe(
      'scroll position x=0 y=400; page 1280x900; viewport 1280x500; max scroll x=0 y=400',
    );
  });

  it('VALID: {a page that fits} => max scroll is 0 on both axes', () => {
    const reading = ScrollReadingStub();

    expect(scrollReadingRenderTransformer({ reading })).toBe(
      'scroll position x=0 y=0; page 1280x720; viewport 1280x720; max scroll x=0 y=0',
    );
  });

  it('EDGE: {document smaller than viewport} => max scroll clamps to 0', () => {
    const reading = ScrollReadingStub({ scrollHeight: 300, viewportHeight: 720 });

    expect(scrollReadingRenderTransformer({ reading })).toBe(
      'scroll position x=0 y=0; page 1280x300; viewport 1280x720; max scroll x=0 y=0',
    );
  });
});
