/**
 * PURPOSE: Closes an OS file descriptor `fsOpenFdAdapter` opened. Lane teardown reaches for this once
 * a spawned process's stdio fd is no longer needed — a descriptor `closeSync` never sees stays open
 * for the life of the driver process, which is the kind of leak a long-running siegelense driver
 * cannot afford to accumulate one instance at a time.
 *
 * USAGE:
 * fsCloseFdAdapter({ fd: FileDescriptorStub({ value: 12 }) });
 * // Closes the descriptor, then returns { success: true }
 */

import { closeSync } from 'fs';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import type { FileDescriptor } from '../../../contracts/file-descriptor/file-descriptor-contract';

export const fsCloseFdAdapter = ({ fd }: { fd: FileDescriptor }): AdapterResult => {
  closeSync(fd);

  return { success: true as const };
};
