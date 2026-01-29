/**
 * PURPOSE: Defines the E2E testbed interface extending InstallTestbed with CLI control methods
 *
 * USAGE:
 * const testbed: E2ETestbed = e2eTestbedCreateBroker({ baseName });
 * await testbed.startCli();
 * await testbed.sendInput({ text: 'hello' });
 * const screen = await testbed.waitForScreen({ screen: 'list' });
 */

import type { z } from 'zod';
import { installTestbedContract } from '../install-testbed/install-testbed-contract';
import type { InstallTestbed } from '../install-testbed/install-testbed-contract';
import type { CliScreenName } from '../cli-screen-name/cli-screen-name-contract';
import type { E2EScreenState } from '../e2e-screen-state/e2e-screen-state-contract';
import type { FileName } from '../file-name/file-name-contract';

export type KeyName = 'enter' | 'escape' | 'up' | 'down' | 'backspace' | 'tab';

export const e2eTestbedContract = installTestbedContract.extend({});

export type E2ETestbedData = z.infer<typeof e2eTestbedContract>;

export interface E2ETestbed extends InstallTestbed {
  /** Starts the CLI subprocess */
  startCli: () => Promise<void>;

  /** Stops the CLI subprocess */
  stopCli: () => void;

  /** Sends text input to CLI stdin */
  sendInput: (args: { text: FileName }) => Promise<void>;

  /** Sends a keypress (escape sequence) to CLI stdin */
  sendKeypress: (args: { key: KeyName }) => Promise<void>;

  /** Gets the current screen state */
  getScreen: () => E2EScreenState;

  /** Waits for a specific screen state with optional content matching */
  waitForScreen: (args: {
    screen: CliScreenName;
    contains?: FileName;
    excludes?: FileName;
    timeout?: number;
  }) => Promise<E2EScreenState>;

  /** Lists quest folders in .dungeonmaster-quests/ */
  getQuestFiles: () => FileName[];

  /** Reads and parses a quest file from a folder */
  readQuestFile: (args: { folder: FileName }) => Record<FileName, unknown>;
}
