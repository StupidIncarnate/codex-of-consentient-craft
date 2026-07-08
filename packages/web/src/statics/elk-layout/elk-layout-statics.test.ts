import { elkLayoutStatics } from './elk-layout-statics';

describe('elkLayoutStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(elkLayoutStatics).toStrictEqual({
      node: {
        width: 240,
      },
      labelEstimate: {
        charsPerLine: 18,
        lineHeight: 16,
        chromeHeight: 40,
        badgeHeight: 22,
        buffer: 12,
      },
      observable: {
        width: 220,
        gap: 56,
        rowGap: 12,
        labelEstimate: {
          charsPerLine: 26,
          lineHeight: 15,
          chromeHeight: 30,
          buffer: 10,
        },
      },
      spacing: {
        nodeNode: 300,
        nodeNodeBetweenLayers: 140,
        edgeNode: 90,
        edgeEdge: 20,
      },
      edgeLabel: {
        maxWidth: 160,
        midpointDivisor: 2,
      },
      loop: {
        detour: 60,
      },
      viewport: {
        minZoom: 0.1,
      },
    });
  });
});
