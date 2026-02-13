/**
 * PURPOSE: Wraps os.homedir() to return a branded AbsoluteFilePath type
 *
 * USAGE:
 * const homedir = osHomedirAdapter();
 * // Returns AbsoluteFilePath branded type: '/home/user'
 */

import { homedir } from 'os';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const osHomedirAdapter = (): AbsoluteFilePath => absoluteFilePathContract.parse(homedir());
