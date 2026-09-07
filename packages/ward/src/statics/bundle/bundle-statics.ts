/**
 * PURPOSE: Names the layout and the build invocation of the hashed e2e bundle. Reach for this
 * rather than spelling a path at a call site: the builder, the artifact sweep and the gitignore
 * entry all have to agree on `.ward/bundle`, and a directory named in only one of them either
 * leaks forever or is reaped out from under a run that is serving it.
 *
 * `.tmp-` is a PREFIX, and the suffix a caller appends must be unique to the process — the build
 * writes into `.tmp-<pid>` and then `rename`s it onto `<hash>`, which is the only way two runs can
 * build the same inputs at once without one of them writing into a directory the other is serving.
 *
 * USAGE:
 * bundleStatics.parentDir;
 * // Returns '.ward/bundle' — the package-relative directory every hashed bundle lives under
 */

export const bundleStatics = {
  // Under `.ward/`, which ward's install already adds to the target repo's .gitignore.
  parentDir: '.ward/bundle',
  tempPrefix: '.tmp-',
  hashAlgorithm: 'sha256',
  // sha-256 rendered as hex.
  hashLength: 64,
  // The package's OWN build script, with the output directory appended. `npm run <script> --` is
  // what forwards the flag to the underlying bundler, so a package whose build is `vite build`
  // receives `vite build --outDir <path>` and nothing about vite is spelled here.
  buildCommand: 'npm',
  buildArgs: ['run', 'build', '--', '--outDir'],
  // The lockfile is hashed alongside the closure's own sources: a dependency version bump changes
  // no file inside any workspace package, and the bundle it produces is a different bundle.
  lockfileName: 'package-lock.json',
  // Everything a workspace package contributes to a bundle built from it. `*.ts` at the package
  // ROOT is not covered by `src/**`: a package's public surface is its root barrels, which live
  // outside src/, and web imports five of shared's at hundreds of sites.
  closurePatterns: ['src/**', '*.ts', 'package.json', 'tsconfig*.json'],
  // The bundler's own inputs, which only the package being bundled has — a library reached through
  // a `dependencies` edge has no vite config and no HTML shell.
  uiPatterns: [
    'vite.config.ts',
    'index.html',
    'postcss.config.cjs',
    'public/**',
    'web-worker-stub.mjs',
  ],
} as const;
