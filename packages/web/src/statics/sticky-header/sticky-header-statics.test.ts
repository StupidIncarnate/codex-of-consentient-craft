import { stickyHeaderStatics } from './sticky-header-statics';

describe('stickyHeaderStatics', () => {
  it('VALID: {default} => exposes the three measured header heights and the z-index band', () => {
    expect(stickyHeaderStatics).toStrictEqual({
      heights: {
        executionRow: 23,
        subagentChain: 31,
        toolRow: 25,
      },
      zIndexBase: 100,
      zIndexFloor: 1,
    });
  });

  it('VALID: {deepest stack} => every header still fits above the z-index floor', () => {
    const deepestStack =
      stickyHeaderStatics.heights.executionRow +
      stickyHeaderStatics.heights.subagentChain +
      stickyHeaderStatics.heights.toolRow;

    expect(stickyHeaderStatics.zIndexBase - deepestStack).toBe(21);
  });
});
