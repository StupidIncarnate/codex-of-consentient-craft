/**
 * PURPOSE: Wraps os.homedir() to return the actual OS user home directory as AbsoluteFilePath
 *
 * USAGE:
 * const homeDir = osUserHomedirAdapter();
 * // Returns AbsoluteFilePath of the real user home directory
 */

import { homedir } from 'os';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const osUserHomedirAdapter = (): AbsoluteFilePath =>
  absoluteFilePathContract.parse(homedir());
