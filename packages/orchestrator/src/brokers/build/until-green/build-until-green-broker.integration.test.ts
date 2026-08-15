import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub, ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { buildUntilGreenBroker } from './build-until-green-broker';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

type StreamedLine = ReturnType<typeof ErrorMessageStub>;

// Real spawned child processes — no adapter is mocked. The unit suite proves the recursion counts
// passes correctly against a staged `spawn`; only this one proves the banner and the child's own
// output reach `onLine` through the real readline plumbing, and that a second pass genuinely sees
// the artefacts the first pass left on disk.
describe('buildUntilGreenBroker (integration) — real spawned build passes', () => {
  const git = gitWorktreeFixtureHarness();

  it('VALID: {build script that only converges on its second run} => returns success and streams one banner per pass', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'bugl-converge' }),
    });
    const cwd = AbsoluteFilePathStub({ value: testbed.guildPath });
    const { buildCommand } = git.writeConvergingBuildScript({
      scriptDir: AbsoluteFilePathStub({ value: `${testbed.guildPath}-build-scripts` }),
    });

    const streamed: StreamedLine[] = [];
    const result = await buildUntilGreenBroker({
      buildCommand,
      cwd,
      onLine: (line): void => {
        streamed.push(ErrorMessageStub({ value: line }));
      },
    });

    const sharedDistExists = git.pathExists({
      absolutePath: AbsoluteFilePathStub({ value: `${cwd}/packages/shared/dist/contracts.js` }),
    });
    const webDistExists = git.pathExists({
      absolutePath: AbsoluteFilePathStub({ value: `${cwd}/packages/web/dist/index.html` }),
    });

    testbed.cleanup();

    expect({
      success: result.success,
      sharedDistExists,
      webDistExists,
      streamed,
    }).toStrictEqual({
      success: true,
      sharedDistExists: true,
      webDistExists: true,
      streamed: ['— build pass 1/3 —', '— build pass 2/3 —'],
    });
  }, 30_000);

  it('ERROR: {build script that always fails} => burns all three passes, returns the last pass output, and streams every pass banner with the child stderr between them', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'bugl-fails' }),
    });
    const cwd = AbsoluteFilePathStub({ value: testbed.guildPath });
    const { buildCommand } = git.writeFailingBuildScript({
      scriptDir: AbsoluteFilePathStub({ value: `${testbed.guildPath}-build-scripts` }),
    });

    const streamed: StreamedLine[] = [];
    const result = await buildUntilGreenBroker({
      buildCommand,
      cwd,
      onLine: (line): void => {
        streamed.push(ErrorMessageStub({ value: line }));
      },
    });

    testbed.cleanup();

    expect({ success: result.success, output: result.output, streamed }).toStrictEqual({
      success: false,
      output: 'fixture build always fails\n',
      streamed: [
        '— build pass 1/3 —',
        'fixture build always fails\n',
        '— build pass 2/3 —',
        'fixture build always fails\n',
        '— build pass 3/3 —',
        'fixture build always fails\n',
      ],
    });
  }, 30_000);
});
