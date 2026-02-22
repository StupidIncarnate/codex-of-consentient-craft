/**
 * PURPOSE: In-memory storage for folder constraint content loaded at startup
 *
 * USAGE:
 * import { folderConstraintsState } from './state/folder-constraints/folder-constraints-state';
 * const content = folderConstraintsState.get({ folderType: FolderTypeStub({ value: 'brokers' }) });
 * // Returns ContentText or undefined
 */
import type { FolderType } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

const constraintsMap = new Map<FolderType, ContentText>();

export const folderConstraintsState = {
  set: ({ folderType, content }: { folderType: FolderType; content: ContentText }): void => {
    constraintsMap.set(folderType, content);
  },

  get: ({ folderType }: { folderType: FolderType }): ContentText | undefined =>
    constraintsMap.get(folderType),

  clear: (): void => {
    constraintsMap.clear();
  },

  getAll: (): Map<FolderType, ContentText> => new Map(constraintsMap),
} as const;
