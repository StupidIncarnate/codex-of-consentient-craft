/**
 * PURPOSE: The git invocations and render limits behind `start`'s stale-build warning — a lane
 * process that serves a gitignored folder its own command names (`vite preview --outDir
 * packages/web/dist`) serves whatever was compiled into it, not the source the API runs live.
 * `changedSinceScript` is ONE shell call on purpose: it finds the commit HEAD's first-parent line
 * held when the folder was last written (`$1`, unix seconds), prints that commit, then every file
 * the working tree now differs from it by. First-parent, because a merge's own side commits carry
 * their original committer dates and would pick a base older than the checkout really was.
 *
 * USAGE:
 * servedBuildStatics.git.checkIgnoreArgs;
 * // Returns ['check-ignore', '--']
 */

export const servedBuildStatics = {
  git: {
    command: 'git',
    checkIgnoreArgs: ['check-ignore', '--'],
    checkIgnoreExit: {
      someIgnored: 0,
      noneIgnored: 1,
    },
    shellCommand: 'sh',
    changedSinceScript:
      'base=$(git rev-list -1 --first-parent --before="@$1" HEAD) && [ -n "$base" ] && printf \'%s\\n\' "$base" && git diff --name-only "$base"',
    shellArgZero: 'sh',
  },
  time: {
    msPerSecond: 1000,
  },
  render: {
    sampleFiles: 5,
    shortCommitLength: 12,
  },
} as const;
