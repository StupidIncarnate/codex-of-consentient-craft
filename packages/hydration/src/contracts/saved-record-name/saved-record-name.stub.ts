import { savedRecordNameContract } from './saved-record-name-contract';
import type { SavedRecordName } from './saved-record-name-contract';

export const SavedRecordNameStub = (
  { value }: { value: string } = { value: 'origin' },
): SavedRecordName => savedRecordNameContract.parse(value);
