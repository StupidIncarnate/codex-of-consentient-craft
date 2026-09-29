import { compareRenderStatics } from './compare-render-statics';

describe('compareRenderStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(compareRenderStatics).toStrictEqual({
      newLines: {
        cap: 5,
        indent: '  ',
        moreTemplate: '  ... {count} more in --json',
      },
      elements: {
        notCompared:
          "ELEMENTS: not compared between the two runs (each run's own last element delta is in --json)",
      },
    });
  });
});
