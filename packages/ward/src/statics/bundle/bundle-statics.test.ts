import { bundleStatics } from './bundle-statics';
import { e2eArtifactsStatics } from '../e2e-artifacts/e2e-artifacts-statics';
import { gitignoreEntriesStatics } from '../gitignore-entries/gitignore-entries-statics';

describe('bundleStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(bundleStatics).toStrictEqual({
      parentDir: '.ward/bundle',
      tempPrefix: '.tmp-',
      hashAlgorithm: 'sha256',
      hashLength: 64,
      buildCommand: 'npm',
      buildArgs: ['run', 'build', '--', '--outDir'],
      lockfileName: 'package-lock.json',
      closurePatterns: ['src/**', '*.ts', 'package.json', 'tsconfig*.json'],
      uiPatterns: [
        'vite.config.ts',
        'index.html',
        'postcss.config.cjs',
        'public/**',
        'web-worker-stub.mjs',
      ],
    });
  });

  // A package's public surface is its root barrels, and those sit OUTSIDE src/. Dropping the
  // root-level pattern reports a bundle as current after the barrel it imports changed — the
  // failure is a stale UI, with nothing anywhere saying the bundle was reused.
  it('VALID: the closure patterns => reach package-root files as well as src/', () => {
    const rootLevel = bundleStatics.closurePatterns.filter(
      (pattern) => !pattern.startsWith('src/'),
    );

    expect(rootLevel).toStrictEqual(['*.ts', 'package.json', 'tsconfig*.json']);
  });

  // The sweep addresses the bundle directory by its own parentDir row. Two spellings of the same
  // path means bundles accumulate forever while the sweep reports success on a directory nothing
  // writes to.
  it('VALID: the bundle directory => is the one the artifact sweep reaps', () => {
    const sweptDirs = e2eArtifactsStatics.artifacts.map((artifact) => artifact.parentDir);

    expect(sweptDirs).toStrictEqual(['node_modules', 'test-results', '.', '.ward/bundle']);
  });

  // A bundle is megabytes per hash and one is minted per distinct input set, so a repo that
  // committed them would grow without bound. `.ward/` already covers it; this pins that it still
  // does if the bundle directory ever moves.
  it('VALID: the bundle directory => sits under an already-ignored path', () => {
    const covering = gitignoreEntriesStatics.entries.filter((entry) =>
      bundleStatics.parentDir.startsWith(entry.replace(/\/$/u, '')),
    );

    expect(covering).toStrictEqual(['.ward/']);
  });

  // `npm run build -- --outDir` forwards the flag to the package's own bundler. Dropping the bare
  // `--` makes npm eat the flag, the build lands in the package's real `dist`, and ward has
  // silently overwritten the artifact `dungeonmaster start` serves.
  it('VALID: the build args => end with the npm argument separator before --outDir', () => {
    expect(bundleStatics.buildArgs).toStrictEqual(['run', 'build', '--', '--outDir']);
  });
});
