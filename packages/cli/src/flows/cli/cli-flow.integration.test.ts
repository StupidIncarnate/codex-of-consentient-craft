import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FileContentsStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import { siegelenseHelpStatics } from '@dungeonmaster/siegelense/statics';

import { cliStatuslineHarness } from '../../../test/harnesses/cli-statusline/cli-statusline.harness';

import { CliSiegelenseResponder } from '../../responders/cli/siegelense/cli-siegelense-responder';
import { CliFlow } from './cli-flow';

type BuiltSiegelenseCall = keyof typeof siegelenseHelpStatics.calls;

// Derived from the same statics the spawned seam test (packages/cli/bin/cli-entry.integration.test.ts)
// reads — never a second hardcoded list — so this fast, in-process check and that slow, spawned one
// can never silently drift apart on which calls are built.
const BUILT_CALL_NAMES = Object.keys(siegelenseHelpStatics.calls) as readonly BuiltSiegelenseCall[];

describe('CliFlow', () => {
  describe('command routing', () => {
    it('VALID: {command: "init"} => routes to init responder and runs package installers', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-flow-init' }),
      });

      await CliFlow({
        command: 'init',
        args: [],
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

  describe('a word that is not a command', () => {
    // Never asserts the SERVE path by calling it: reaching CliServeResponder binds
    // `dungeonmaster.port` and opens a browser, so a test proving "it did not serve" by serving is
    // the bug it is meant to catch. The throw is what proves the fallthrough is closed.
    it('ERROR: {command: "seigelense"} => refuses by name rather than falling through to the server', async () => {
      await expect(
        CliFlow({
          command: 'seigelense',
          args: [],
          context: {
            targetProjectRoot: FilePathStub({ value: '/repo' }),
            dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
          },
        }),
      ).rejects.toThrow(
        'Unknown command: seigelense. Commands: init, start, statusline-tap, create-package, siegelense.',
      );
    });

    it('ERROR: {command: "--help"} => refuses and lists the commands, rather than booting a server', async () => {
      await expect(
        CliFlow({
          command: '--help',
          args: [],
          context: {
            targetProjectRoot: FilePathStub({ value: '/repo' }),
            dungeonmasterRoot: FilePathStub({ value: '/dungeonmaster' }),
          },
        }),
      ).rejects.toThrow(/^Unknown command: --help\. Commands: /u);
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
        args: [],
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
        args: [],
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
        args: [],
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
        args: [],
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

  describe('command routing - create-package', () => {
    const harness = cliStatuslineHarness();

    it('VALID: {command: "create-package", args: --name/--type} => writes the package and registers it in the root package.json', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-flow-create-package' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: `{\n  "name": "probe-root",\n  "version": "0.0.0",\n  "workspaces": ["packages/*"],\n  "dependencies": {\n    "@probe/shared": "*"\n  }\n}\n`,
        }),
      });
      const stdout = harness.captureStdout();

      await CliFlow({
        command: 'create-package',
        args: ['--name', 'widgets', '--type', 'library'],
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      stdout.restore();
      const generatedPackageJson = testbed.readFile({
        relativePath: RelativePathStub({ value: 'packages/widgets/package.json' }),
      });
      const generatedSeed = testbed.readFile({
        relativePath: RelativePathStub({
          value: 'packages/widgets/src/statics/widgets/widgets-statics.ts',
        }),
      });
      const rootPackageJson = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(generatedPackageJson).toMatch(/^ {2}"name": "@probe\/widgets",$/mu);
      expect(generatedSeed).toMatch(/^export const widgetsStatics = \{$/mu);
      expect(rootPackageJson).toMatch(/^ {4}"@probe\/widgets": "\*",?$/mu);
    });

    it('INVALID: {command: "create-package", args: --type only} => throws naming the missing --name flag and writes nothing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-flow-create-package-missing-name' }),
      });
      const stdout = harness.captureStdout();

      const attempt = CliFlow({
        command: 'create-package',
        args: ['--type', 'library'],
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      await expect(attempt).rejects.toThrow(/^--name is required/u);

      stdout.restore();
      const packagesDir = testbed.listDir({
        relativePath: RelativePathStub({ value: 'packages' }),
      });

      testbed.cleanup();

      expect(packagesDir).toBe(null);
    });
  });

  describe('command routing - siegelense', () => {
    const harness = cliStatuslineHarness();

    // `CliSiegelenseResponder` reaches `@dungeonmaster/siegelense/startup` through a real dynamic
    // import — never mocked here, see that file's own header for why. ts-jest transpiles that
    // module's whole graph on first touch, and Jest attributes a lazily-compiled import's cost to
    // whichever `it` triggers it, not to the suite. `beforeAll` runs outside every `it`'s own
    // measured window, so paying that one-time cost here — result discarded — keeps it off whichever
    // test happens to run first, the same fixture-cost pattern `get-testing-patterns` names for a
    // spawned child or a compiled module graph.
    beforeAll(async () => {
      const stdout = harness.captureStdout();
      await CliSiegelenseResponder({ args: [] });
      stdout.restore();
    });

    it('VALID: {command: "siegelense", args: []} => routes through the real dynamic import to the fleet responder and reports an empty registry', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-flow-siegelense-bare' }),
      });
      const env = harness.setupHome({ tempDir: testbed.guildPath });
      const stdout = harness.captureStdout();

      await CliFlow({
        command: 'siegelense',
        args: [],
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      stdout.restore();
      const stdoutOutput = stdout.getOutput();

      env.restore();
      testbed.cleanup();

      expect(stdoutOutput).toStrictEqual(['No siegelense instances running.\n']);
    });

    // Beside the bare-invocation test above, driving the same real dynamic import — the cheaper
    // half of the seam test: a fast, unit-speed check that reads the first line the same way the
    // slow, spawned check in cli-entry.integration.test.ts does, so a renderer or routing
    // regression shows up here first.
    it.each(BUILT_CALL_NAMES)(
      "VALID: {command: \"siegelense\", args: ['%s', '--help']} => routes through the real dynamic import to that call's help page",
      async (call) => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: `cli-flow-siegelense-help-${call}` }),
        });
        const env = harness.setupHome({ tempDir: testbed.guildPath });
        const stdout = harness.captureStdout();

        await CliFlow({
          command: 'siegelense',
          args: [call, '--help'],
          context: {
            targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        });

        stdout.restore();
        const stdoutOutput = stdout.getOutput();

        env.restore();
        testbed.cleanup();

        const [firstWrite] = stdoutOutput;

        expect(String(firstWrite).split('\n')[0]).toBe(siegelenseHelpStatics.calls[call].summary);
      },
    );
  });
});
