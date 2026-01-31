import { warningMessageContract } from './warning-message-contract';
import type { WarningMessage } from './warning-message-contract';

export const WarningMessageStub = (
  { value }: { value?: string } = { value: 'Warning: Test warning message' },
): WarningMessage => warningMessageContract.parse(value);
