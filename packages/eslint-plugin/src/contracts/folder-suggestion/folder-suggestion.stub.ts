import { folderSuggestionContract } from './folder-suggestion-contract';
import type { FolderSuggestion } from './folder-suggestion-contract';

export const FolderSuggestionStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'contracts',
  },
): FolderSuggestion => folderSuggestionContract.parse(value);
