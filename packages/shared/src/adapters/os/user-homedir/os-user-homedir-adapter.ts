/**
 * PURPOSE: Wraps os.homedir() to return the actual OS user home directory, ignoring DUNGEONMASTER_HOME
 *
 * USAGE:
 * const homedir = osUserHomedirAdapter();
 * // Returns AbsoluteFilePath branded type: '/home/user' (always the real OS home, never DUNGEONMASTER_HOME)
 */

import { homedir } from 'os';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const osUserHomedirAdapter = (): AbsoluteFilePath =>
  absoluteFilePathContract.parse(homedir());
