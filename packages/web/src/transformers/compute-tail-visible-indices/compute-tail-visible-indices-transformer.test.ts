import { TailStartIndexStub } from '../../contracts/tail-start-index/tail-start-index.stub';
import { computeTailVisibleIndicesTransformer } from './compute-tail-visible-indices-transformer';

describe('computeTailVisibleIndicesTransformer', () => {
  it('EMPTY: {flags: []} => returns []', () => {
    expect(
      computeTailVisibleIndicesTransformer({ isAnchorFlags: [], isSubagentChainFlags: [] }),
    ).toStrictEqual([]);
  });

  it('VALID: {single tool} => returns [0] (last index)', () => {
    expect(
      computeTailVisibleIndicesTransformer({
        isAnchorFlags: [false],
        isSubagentChainFlags: [false],
      }),
    ).toStrictEqual([TailStartIndexStub({ value: 0 })]);
  });

  it('VALID: {anchor text + 3 tool pairs} => returns [0, 3] (anchor + last)', () => {
    expect(
      computeTailVisibleIndicesTransformer({
        isAnchorFlags: [true, false, false, false],
        isSubagentChainFlags: [false, false, false, false],
      }),
    ).toStrictEqual([TailStartIndexStub({ value: 0 }), TailStartIndexStub({ value: 3 })]);
  });

  it('VALID: {3 tool pairs, no anchor} => returns [2] (last only)', () => {
    expect(
      computeTailVisibleIndicesTransformer({
        isAnchorFlags: [false, false, false],
        isSubagentChainFlags: [false, false, false],
      }),
    ).toStrictEqual([TailStartIndexStub({ value: 2 })]);
  });

  it('VALID: {tools + anchor + 2 chains} => returns [anchorIdx, chainA, chainB] (anchor + both chains visible)', () => {
    expect(
      computeTailVisibleIndicesTransformer({
        isAnchorFlags: [false, false, true, true, true],
        isSubagentChainFlags: [false, false, false, true, true],
      }),
    ).toStrictEqual([
      TailStartIndexStub({ value: 2 }),
      TailStartIndexStub({ value: 3 }),
      TailStartIndexStub({ value: 4 }),
    ]);
  });

  it('VALID: {no anchor + 2 chains separated by tool} => returns [0, 2] (both chains visible, tool hidden)', () => {
    expect(
      computeTailVisibleIndicesTransformer({
        isAnchorFlags: [true, false, true],
        isSubagentChainFlags: [true, false, true],
      }),
    ).toStrictEqual([TailStartIndexStub({ value: 0 }), TailStartIndexStub({ value: 2 })]);
  });

  it('VALID: {message anchor is last unit} => returns [lastIndex] (single visible)', () => {
    expect(
      computeTailVisibleIndicesTransformer({
        isAnchorFlags: [false, false, true],
        isSubagentChainFlags: [false, false, false],
      }),
    ).toStrictEqual([TailStartIndexStub({ value: 2 })]);
  });
});
