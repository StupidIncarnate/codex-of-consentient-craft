import { platformContract } from './platform-contract';
import type { Platform } from './platform-contract';

export const PlatformStub = ({ value }: { value?: string } = {}): Platform =>
  platformContract.parse(value ?? 'browser');
