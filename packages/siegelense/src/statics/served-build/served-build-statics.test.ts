import { servedBuildStatics } from './served-build-statics';

describe('servedBuildStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(servedBuildStatics).toStrictEqual({
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
    });
  });
});
