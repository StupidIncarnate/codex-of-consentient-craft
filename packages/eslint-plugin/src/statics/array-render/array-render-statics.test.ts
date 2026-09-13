import { arrayRenderStatics } from './array-render-statics';

describe('arrayRenderStatics', () => {
  describe('renderingMethods', () => {
    // Asserting the COMPLETE array is what pins the absences too: `filter`, `sort` and `slice`
    // choose which rows render and never produce markup, so a callback of theirs holding a
    // variable is ordinary data work. A membership check on each of those names does not
    // typecheck — the tuple's type has no overlap with them — which is the compiler making the
    // same point.
    it('VALID: {} => names lists exactly the row-producing methods, and nothing else', () => {
      expect(arrayRenderStatics.renderingMethods.names).toStrictEqual(['map', 'flatMap']);
    });
  });
});
