import { CssPixelsStub } from '@dungeonmaster/shared/contracts';

import { stickyHeaderZIndexTransformer } from './sticky-header-z-index-transformer';
import { stickyHeaderStatics } from '../../statics/sticky-header/sticky-header-statics';

const { heights, zIndexBase, zIndexFloor } = stickyHeaderStatics;

// The offsets an actual render produces, outermost first: an execution row pins at 0, a sub-agent
// chain inside it clears the row header, and a tool row inside that chain clears both.
const NESTED_STACK_OFFSETS = [
  0,
  heights.executionRow,
  heights.executionRow + heights.subagentChain,
  heights.executionRow + heights.subagentChain + heights.toolRow,
] as const;

describe('stickyHeaderZIndexTransformer', () => {
  describe('offset to band', () => {
    it('VALID: {stickyTop: 0} => returns the base band for a header pinned flush to the panel', () => {
      const result = stickyHeaderZIndexTransformer({ stickyTop: CssPixelsStub({ value: 0 }) });

      expect(Number(result)).toBe(100);
    });

    it('VALID: {stickyTop: 23} => returns 77 for a header pinned under an execution row', () => {
      const result = stickyHeaderZIndexTransformer({
        stickyTop: CssPixelsStub({ value: heights.executionRow }),
      });

      expect(Number(result)).toBe(77);
    });

    it('VALID: {stickyTop: 54} => returns 46 for a tool row inside a chain inside a row', () => {
      const result = stickyHeaderZIndexTransformer({
        stickyTop: CssPixelsStub({ value: heights.executionRow + heights.subagentChain }),
      });

      expect(Number(result)).toBe(46);
    });
  });

  describe('floor', () => {
    it('EDGE: {stickyTop: 99} => returns 1, the last band above the floor', () => {
      const result = stickyHeaderZIndexTransformer({
        stickyTop: CssPixelsStub({ value: zIndexBase - zIndexFloor }),
      });

      expect(Number(result)).toBe(1);
    });

    it('EDGE: {stickyTop: 400} => clamps to the floor rather than painting behind the container', () => {
      const result = stickyHeaderZIndexTransformer({ stickyTop: CssPixelsStub({ value: 400 }) });

      expect(Number(result)).toBe(1);
    });
  });

  describe('nesting order', () => {
    // The property the whole derivation exists for: an inner header sits later in the DOM, so it
    // wins on paint order at `z-index: auto` and would slide across an already-pinned outer one.
    it('VALID: {row > chain > tool offsets} => band strictly decreases with depth', () => {
      const bands = NESTED_STACK_OFFSETS.map((offset) =>
        Number(stickyHeaderZIndexTransformer({ stickyTop: CssPixelsStub({ value: offset }) })),
      );

      expect(bands).toStrictEqual([100, 77, 46, 21]);
    });
  });
});
