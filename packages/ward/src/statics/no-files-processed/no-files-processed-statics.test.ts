import { noFilesProcessedStatics } from './no-files-processed-statics';

describe('noFilesProcessedStatics', () => {
  // Pinning the whole object holds the two load-bearing claims: the heading says NO CHECK PROCESSED
  // rather than reporting a count, and the guidance names both causes a headless session cannot ask
  // anyone about — a path outside every workspace package, and a check that excludes it. The output
  // these lines replace is `lint: WARN 0 files run` at exit 0, reproduced live on
  // `scripts/build-workspaces.mjs`, which reads as a pass.
  it('VALID: exported value => is exactly the heading and guidance, and nothing else', () => {
    expect(noFilesProcessedStatics).toStrictEqual({
      heading:
        'ward: NO CHECK PROCESSED these paths — they are on disk, and every file-scoped check in this run reported 0 files:',
      guidance:
        'A scope nothing checked is not a green run. Either the path lives outside every workspace package (ward spawns no child for it), or the checks you asked for exclude it — an eslint.config.js `ignores` entry, or a package that owns no test related to it. Fix the scope or the exclusion; do not read this run as a pass. Typecheck is not counted here because it always runs whole-package, regardless of file scope.',
    });
  });
});
