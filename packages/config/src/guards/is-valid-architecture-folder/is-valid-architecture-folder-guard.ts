/**
 * PURPOSE: Validates if a value is a valid architecture folder type
 *
 * USAGE:
 * isValidArchitectureFolderGuard({folder: 'brokers'});
 * // Returns true if folder is valid, false otherwise
 */

import { isInReadonlyArrayGuard } from '../is-in-readonly-array/is-in-readonly-array-guard';
import { architectureFolderStatics } from '../../statics/architecture-folder/architecture-folder-statics';

export const isValidArchitectureFolderGuard = ({ folder }: { folder?: unknown }): boolean =>
  isInReadonlyArrayGuard({ value: folder, array: architectureFolderStatics.folders.all });
