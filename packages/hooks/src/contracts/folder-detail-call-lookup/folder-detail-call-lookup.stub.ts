import { folderDetailCallLookupContract } from './folder-detail-call-lookup-contract';
import type { FolderDetailCallLookup } from './folder-detail-call-lookup-contract';

export const FolderDetailCallLookupStub = (
  { value }: { value: string } = { value: 'called' },
): FolderDetailCallLookup => folderDetailCallLookupContract.parse(value);
