import { elkLayoutStatics } from './elk-layout-statics';

describe('elkLayoutStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(elkLayoutStatics).toStrictEqual({
      node: {
        width: 240,
        height: 150,
      },
      labelMaxLines: 4,
      spacing: {
        nodeNode: 160,
        nodeNodeBetweenLayers: 90,
        edgeNode: 30,
        edgeEdge: 20,
      },
      edgeLabelMaxChars: 22,
    });
  });
});
