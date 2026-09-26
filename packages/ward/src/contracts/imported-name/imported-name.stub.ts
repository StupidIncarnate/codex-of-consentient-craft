import { importedNameContract } from './imported-name-contract';
import type { ImportedName } from './imported-name-contract';

export const ImportedNameStub = ({ value }: { value?: string } = {}): ImportedName =>
  importedNameContract.parse(value ?? 'readFileIfExists');
