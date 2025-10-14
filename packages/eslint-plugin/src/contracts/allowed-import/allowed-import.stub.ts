import { allowedImportContract } from './allowed-import-contract';
import type { AllowedImport } from './allowed-import-contract';

export const AllowedImportStub = (
  { value }: { value: string } = { value: 'contracts/' },
): AllowedImport => allowedImportContract.parse(value);
