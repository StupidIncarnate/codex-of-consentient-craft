/**
 * PURPOSE: In-memory storage for folder constraint content loaded at startup
 *
 * USAGE:
 * import { folderConstraintsState } from './state/folder-constraints/folder-constraints-state';
 * const content = folderConstraintsState.get({ folderType: FolderTypeStub({ value: 'brokers' }) });
 * // Returns ContentText or undefined
 */
import type { FolderType } from '@dungeonmaster/shared/contracts';

const constraintsMap = new Map<FolderType, string>();

export const folderConstraintsState = {
  set: ({ folderType, content }: { folderType: FolderType; content: string }): void => {
    constraintsMap.set(folderType, content);
  },

  get: ({ folderType }: { folderType: FolderType }): string | undefined =>
    constraintsMap.get(folderType),

  clear: (): void => {
    constraintsMap.clear();
  },

  getAll: (): Map<FolderType, string> => new Map(constraintsMap),
} as const;
