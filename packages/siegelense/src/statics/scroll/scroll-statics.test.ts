import { scrollStatics } from './scroll-statics';

describe('scrollStatics', () => {
  it('VALID: exported value => names the edges and the reading wording', () => {
    expect({ ...scrollStatics, readSource: 'elided' }).toStrictEqual({
      edges: { top: 'top', bottom: 'bottom' },
      readSource: 'elided',
      cutoff: {
        prefix: 'CUT OFF — ',
        tall: 'page {size}px tall',
        wide: 'page {size}px wide',
        above: '{amount}px above the viewport',
        below: '{amount}px below the viewport',
        left: '{amount}px left of the viewport',
        right: '{amount}px right of the viewport',
        separator: '; ',
      },
      position: {
        template:
          'scroll position x={x} y={y}; page {pageWidth}x{pageHeight}; viewport {viewportWidth}x{viewportHeight}; max scroll x={maxX} y={maxY}',
      },
    });
  });

  it('VALID: {readSource} => is one self-invoked expression reading the six geometry fields', () => {
    expect(scrollStatics.readSource).toBe(`(() => ({
  scrollX: Math.max(0, Math.round(window.scrollX)),
  scrollY: Math.max(0, Math.round(window.scrollY)),
  scrollWidth: Math.max(0, Math.round(document.documentElement.scrollWidth)),
  scrollHeight: Math.max(0, Math.round(document.documentElement.scrollHeight)),
  viewportWidth: Math.max(0, Math.round(window.innerWidth)),
  viewportHeight: Math.max(0, Math.round(window.innerHeight)),
}))()`);
  });
});
