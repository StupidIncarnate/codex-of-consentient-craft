import { gitScopeDroppedPathsStatics } from './git-scope-dropped-paths-statics';

describe('gitScopeDroppedPathsStatics', () => {
  // THE WORD "DROPPED" IS LOAD-BEARING, not "not found": the caller-typed refusal
  // (pathNotFoundStatics) names a typo, and this line names the opposite verdict for the same
  // symptom — the run keeps going without the path rather than refusing outright.
  it('VALID: exported value => is exactly the one heading line and nothing else', () => {
    expect(gitScopeDroppedPathsStatics).toStrictEqual({
      heading: 'ward: dropped from the git-derived scope — no longer on disk:',
    });
  });
});
