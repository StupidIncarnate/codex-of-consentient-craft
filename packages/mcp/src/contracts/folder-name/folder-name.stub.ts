/**
 * PURPOSE: Creates test data for folder names
 *
 * USAGE:
 * const folder = FolderNameStub({ value: 'guards' });
 * // Returns branded FolderName string
 */
import { folderNameContract } from './folder-name-contract';
import type { FolderName } from './folder-name-contract';

export const FolderNameStub = ({ value }: { value: string } = { value: 'guards' }): FolderName =>
  folderNameContract.parse(value);
