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
      spacing: {
        nodeNode: 180,
        nodeNodeBetweenLayers: 110,
        edgeNode: 30,
        edgeEdge: 20,
      },
      edgeLabelMaxWidth: 160,
    });
  });
});
