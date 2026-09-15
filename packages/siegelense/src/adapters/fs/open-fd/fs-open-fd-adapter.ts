/**
 * PURPOSE: Opens a file in append mode and returns its raw OS file descriptor. `laneBootBroker` needs
 * this rather than `fsAppendFileAdapter` because a spawned process's `stdio` array takes a real fd
 * number, not a stream or a promise — `openSync` is the only primitive that produces one. Always
 * paired with `fsCloseFdAdapter` once the spawned process exits, since a leaked fd outlives the
 * process that opened it.
 *
 * USAGE:
 * const fd = fsOpenFdAdapter({
 *   filePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21/api-server.log' }),
 * });
 * // Returns the open FileDescriptor, creating the file if it did not exist
 */

import { openSync } from 'fs';
import {
  fileDescriptorContract,
  type FileDescriptor,
} from '../../../contracts/file-descriptor/file-descriptor-contract';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsOpenFdAdapter = ({ filePath }: { filePath: AbsoluteFilePath }): FileDescriptor =>
  fileDescriptorContract.parse(openSync(filePath, 'a'));
