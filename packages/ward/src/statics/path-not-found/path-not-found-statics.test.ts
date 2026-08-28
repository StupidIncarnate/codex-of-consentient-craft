import { pathNotFoundStatics } from './path-not-found-statics';

describe('pathNotFoundStatics', () => {
  // TWO THINGS IN THESE LINES ARE LOAD-BEARING, and pinning the whole object holds both: the heading
  // says NO CHECKS RAN rather than reporting a count, and the guidance names the recovery a headless
  // session has no one to ask for. The outcome they replace is `lint: WARN 0 files run` at exit 0 —
  // reproduced live on `packages/definitely-not-a-package/src/nope.ts` — which reads as a pass.
  it('VALID: exported value => is exactly the heading and guidance, and nothing else', () => {
    expect(pathNotFoundStatics).toStrictEqual({
      heading: 'ward: NO CHECKS RAN — these paths in the file scope are not on disk:',
      guidance:
        'A scope naming a path disk does not have is a typo, not an empty run. Fix the spelling or drop the path. Paths are repo-relative.',
    });
  });
});
