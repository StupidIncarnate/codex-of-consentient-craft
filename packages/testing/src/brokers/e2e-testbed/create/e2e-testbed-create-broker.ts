/**
 * PURPOSE: Creates E2E test environments for CLI integration testing with subprocess control
 *
 * USAGE:
 * const testbed = e2eTestbedCreateBroker({ baseName: BaseNameStub({ value: 'e2e-test' }) });
 * await testbed.startCli();
 * await testbed.sendInput({ text: 'hello' });
 * const screen = await testbed.waitForScreen({ screen: 'list', contains: 'quest' });
 * testbed.stopCli();
 * testbed.cleanup();
 */

import { installTestbedCreateBroker } from '../../install-testbed/create/install-testbed-create-broker';
import { e2eConfigSetupBroker } from '../../e2e-config/setup/e2e-config-setup-broker';
import { nodePtySpawnAdapter } from '../../../adapters/node-pty/spawn/node-pty-spawn-adapter';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { screenFrameContract } from '../../../contracts/screen-frame/screen-frame-contract';
import { subdirNameContract } from '../../../contracts/subdir-name/subdir-name-contract';
import { envRecordContract } from '../../../contracts/env-record/env-record-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { signalNameContract } from '../../../contracts/signal-name/signal-name-contract';
import { detectCliScreenTransformer } from '../../../transformers/detect-cli-screen/detect-cli-screen-transformer';
import { sleepPromiseTransformer } from '../../../transformers/sleep-promise/sleep-promise-transformer';
import { pollUntilMatchTransformer } from '../../../transformers/poll-until-match/poll-until-match-transformer';
import { e2eTimeoutsStatics } from '../../../statics/e2e-timeouts/e2e-timeouts-statics';
import { e2eKeyCodesStatics } from '../../../statics/e2e-key-codes/e2e-key-codes-statics';
import { e2eScreenPatternsStatics } from '../../../statics/e2e-screen-patterns/e2e-screen-patterns-statics';
import type { Quest } from '@dungeonmaster/shared/contracts';
import type { BaseName } from '../../../contracts/base-name/base-name-contract';
import type { CliScreenName } from '../../../contracts/cli-screen-name/cli-screen-name-contract';
import type { E2EScreenState } from '../../../contracts/e2e-screen-state/e2e-screen-state-contract';
import type { E2ETestbed, KeyName } from '../../../contracts/e2e-testbed/e2e-testbed-contract';
import type { ScreenFrame } from '../../../contracts/screen-frame/screen-frame-contract';
import type { SubdirName } from '../../../contracts/subdir-name/subdir-name-contract';

type NodePtyInstance = ReturnType<typeof nodePtySpawnAdapter>;

export const e2eTestbedCreateBroker = ({ baseName }: { baseName: BaseName }): E2ETestbed => {
  const installTestbed = installTestbedCreateBroker({ baseName });

  let cliProcess: NodePtyInstance | null = null;
  let outputBuffer = '';

  const testbed: E2ETestbed = {
    ...installTestbed,

    startCli: async (): Promise<void> => {
      // Set up E2E config files programmatically (avoids TTY requirement of dungeonmaster init)
      e2eConfigSetupBroker({
        projectPath: installTestbed.projectPath,
        dungeonmasterPath: installTestbed.dungeonmasterPath,
      });

      const cliPath = pathJoinAdapter({
        paths: [installTestbed.dungeonmasterPath, 'packages/cli/src/startup/start-cli.ts'],
      });

      cliProcess = nodePtySpawnAdapter({
        command: 'npx',
        args: ['tsx', cliPath],
        options: {
          cwd: filePathContract.parse(installTestbed.projectPath),
          env: envRecordContract.parse({ ...process.env, FORCE_COLOR: '0' }),
        },
      });

      cliProcess.onData((data) => {
        outputBuffer += data;
      });

      await sleepPromiseTransformer({ ms: e2eTimeoutsStatics.processStartup });
    },

    stopCli: (): void => {
      if (cliProcess) {
        cliProcess.kill(signalNameContract.parse('SIGTERM'));
        cliProcess = null;
      }
      outputBuffer = '';
    },

    sendInput: async ({ text }: { text: ScreenFrame }): Promise<void> => {
      if (!cliProcess) {
        throw new Error('CLI process not started');
      }
      cliProcess.write(text);
      await sleepPromiseTransformer({ ms: e2eTimeoutsStatics.pollInterval });
    },

    sendKeypress: async ({ key }: { key: KeyName }): Promise<void> => {
      if (!cliProcess) {
        throw new Error('CLI process not started');
      }
      const keyCode = e2eKeyCodesStatics[key];
      cliProcess.write(keyCode);
      await sleepPromiseTransformer({ ms: e2eTimeoutsStatics.pollInterval });
    },

    getScreen: (): E2EScreenState => {
      const frame = screenFrameContract.parse(outputBuffer);
      const name = detectCliScreenTransformer({ frame });
      return {
        name,
        frame,
        capturedAt: Date.now(),
      } as E2EScreenState;
    },

    waitForScreen: async ({
      screen,
      contains,
      excludes,
      timeout = e2eTimeoutsStatics.defaultWait,
    }: {
      screen: CliScreenName;
      contains?: ScreenFrame;
      excludes?: ScreenFrame;
      timeout?: number;
    }): Promise<E2EScreenState> => {
      const tailLength = e2eScreenPatternsStatics.errorOutputTailLength;

      return pollUntilMatchTransformer({
        check: (): E2EScreenState | null => {
          const frame = screenFrameContract.parse(outputBuffer);
          const detectedScreen = detectCliScreenTransformer({ frame });

          const screenMatches = detectedScreen === screen;
          const containsMatches = !contains || frame.includes(String(contains));
          const excludesMatches = !excludes || !frame.includes(String(excludes));

          if (screenMatches && containsMatches && excludesMatches) {
            return {
              name: detectedScreen,
              frame,
              capturedAt: Date.now(),
            } as E2EScreenState;
          }
          return null;
        },
        interval: e2eTimeoutsStatics.pollInterval,
        timeout,
        timeoutMessage: `Timeout waiting for screen "${screen}"${contains ? ` containing "${String(contains)}"` : ''}. Last output:\n${outputBuffer.slice(-tailLength)}`,
      });
    },

    getQuestFiles: (): SubdirName[] => {
      const questsDir = pathJoinAdapter({
        paths: [installTestbed.projectPath, '.dungeonmaster-quests'],
      });
      if (!fsExistsAdapter({ filePath: questsDir })) {
        return [];
      }
      const entries = fsReaddirAdapter({ dirPath: questsDir });
      return entries.map((entry) => subdirNameContract.parse(entry));
    },

    readQuestFile: ({ folder }: { folder: SubdirName }): Quest => {
      const questPath = pathJoinAdapter({
        paths: [installTestbed.projectPath, '.dungeonmaster-quests', folder, 'quest.json'],
      });
      if (!fsExistsAdapter({ filePath: questPath })) {
        throw new Error(`Quest file not found: ${questPath}`);
      }
      const content = fsReadFileAdapter({ filePath: questPath });
      return JSON.parse(content) as Quest;
    },

    getFirstQuest: (): Quest => {
      const folders = testbed.getQuestFiles();
      const [firstFolder] = folders;
      if (firstFolder === undefined) {
        throw new Error('No quest files found in .dungeonmaster-quests/');
      }
      return testbed.readQuestFile({ folder: firstFolder });
    },
  };

  return testbed;
};
