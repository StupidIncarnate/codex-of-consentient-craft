import { duplicateInstallDisplayTextContract } from './duplicate-install-display-text-contract';
import type { DuplicateInstallDisplayText } from './duplicate-install-display-text-contract';

export const DuplicateInstallDisplayTextStub = (
  { value }: { value: string } = { value: 'duplicate-install: PASS' },
): DuplicateInstallDisplayText => duplicateInstallDisplayTextContract.parse(value);
