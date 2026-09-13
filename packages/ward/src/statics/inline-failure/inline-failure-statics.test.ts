import { inlineFailureStatics } from './inline-failure-statics';

describe('inlineFailureStatics', () => {
  // PINNING THE WHOLE OBJECT holds the one claim the value carries: a cap exists, so a summary that
  // now prints whole failure messages cannot grow without bound and spill to a file — which is the
  // cost the inline printing was added to avoid.
  it('VALID: exported value => is exactly the per-message line cap, and nothing else', () => {
    expect(inlineFailureStatics).toStrictEqual({
      message: {
        maxLines: 40,
      },
    });
  });
});
