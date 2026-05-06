import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FileContentsStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { cliStatuslineHarness } from '../../../test/harnesses/cli-statusline/cli-statusline.harness';

import { CliFlow } from './cli-flow';

describe('CliFlow', () => {
  describe('command routing', () => {
    it('VALID: {command: "init"} => routes to init responder and runs package installers', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-flow-init' }),
      });

      await CliFlow({
        command: 'init',
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(packageJsonContent).toMatch(/^\s*"devDependencies": \{$/mu);
    });
  });

  describe('command routing - statusline-tap', () => {
    const harness = cliStatuslineHarness();

    it('VALID: {command: "statusline-tap", stdin: full payload} => writes snapshot.json + history.jsonl and echoes stdin to stdout', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-flow-statusline-tap-write' }),
      });
      const env = harness.setupHome({ tempDir: testbed.guildPath });
      const inputData = FileContentsStub({
        value: JSON.stringify({
          rate_limits: {
            five_hour: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' },
            seven_day: { used_percentage: 20, resets_at: '2026-05-05T15:00:00.000Z' },
          },
        }),
      });
      const stdin = harness.setupStdin({ data: inputData });
      const stdout = harness.captureStdout();
      const stderr = harness.captureStderr();

      await CliFlow({
        command: 'statusline-tap',
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      stdin.restore();
      stdout.restore();
      stderr.restore();
      const stdoutOutput = stdout.getOutput();
      const stderrOutput = stderr.getOutput();
      const snapshotContent = harness.readSnapshot({ tempDir: testbed.guildPath });
      const historyContent = harness.readHistory({ tempDir: testbed.guildPath });

      env.restore();
      testbed.cleanup();

      expect(stderrOutput).toStrictEqual([]);
      expect(stdoutOutput).toStrictEqual([inputData]);
      expect(snapshotContent).toMatch(
        /^\{"fiveHour":\{"usedPercentage":42,"resetsAt":"2026-05-05T15:00:00\.000Z"\},"sevenDay":\{"usedPercentage":20,"resetsAt":"2026-05-05T15:00:00\.000Z"\},"updatedAt":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"\}\n$/u,
      );
      expect(historyContent).toMatch(
        /^\{"at":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z","fiveHour":\{"usedPercentage":42,"resetsAt":"2026-05-05T15:00:00\.000Z"\},"sevenDay":\{"usedPercentage":20,"resetsAt":"2026-05-05T15:00:00\.000Z"\}\}\n$/u,
      );
    });

    it('EDGE: {command: "statusline-tap", second call within throttle window} => stdout passthrough succeeds, snapshot file unchanged, history line not appended', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-flow-statusline-tap-throttle' }),
      });
      const env = harness.setupHome({ tempDir: testbed.guildPath });
      const inputData = FileContentsStub({
        value: JSON.stringify({
          rate_limits: {
            five_hour: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' },
          },
        }),
      });

      const firstStdin = harness.setupStdin({ data: inputData });
      const firstStdout = harness.captureStdout();
      await CliFlow({
        command: 'statusline-tap',
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });
      firstStdin.restore();
      firstStdout.restore();
      const firstHistory = harness.readHistory({ tempDir: testbed.guildPath });

      const secondStdin = harness.setupStdin({ data: inputData });
      const secondStdout = harness.captureStdout();
      await CliFlow({
        command: 'statusline-tap',
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });
      secondStdin.restore();
      secondStdout.restore();
      const secondStdoutOutput = secondStdout.getOutput();
      const secondHistory = harness.readHistory({ tempDir: testbed.guildPath });

      env.restore();
      testbed.cleanup();

      expect(secondStdoutOutput).toStrictEqual([inputData]);
      expect(secondHistory).toBe(firstHistory);
    });

    it('ERROR: {command: "statusline-tap", malformed JSON stdin} => stdout passthrough succeeds, no snapshot file written, exits cleanly', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-flow-statusline-tap-malformed' }),
      });
      const env = harness.setupHome({ tempDir: testbed.guildPath });
      const inputData = FileContentsStub({ value: 'not json at all' });
      const stdin = harness.setupStdin({ data: inputData });
      const stdout = harness.captureStdout();

      await CliFlow({
        command: 'statusline-tap',
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      stdin.restore();
      stdout.restore();
      const stdoutOutput = stdout.getOutput();
      const snapshotPresent = harness.snapshotExists({ tempDir: testbed.guildPath });

      env.restore();
      testbed.cleanup();

      expect(stdoutOutput).toStrictEqual([inputData]);
      expect(snapshotPresent).toBe(false);
    });
  });
});
