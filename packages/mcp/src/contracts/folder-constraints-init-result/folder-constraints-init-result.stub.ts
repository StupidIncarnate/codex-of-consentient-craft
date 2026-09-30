/**
 * PURPOSE: Builds a valid FolderConstraintsInitResult for tests
 *
 * USAGE:
 * FolderConstraintsInitResultStub();
 * // Returns a valid FolderConstraintsInitResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { folderConstraintsInitResultContract } from './folder-constraints-init-result-contract';
import type { FolderConstraintsInitResult } from './folder-constraints-init-result-contract';

export const FolderConstraintsInitResultStub = ({
  ...props
}: StubArgument<FolderConstraintsInitResult> = {}): FolderConstraintsInitResult =>
  folderConstraintsInitResultContract.parse({ folderConstraints: new Map(), ...props });
