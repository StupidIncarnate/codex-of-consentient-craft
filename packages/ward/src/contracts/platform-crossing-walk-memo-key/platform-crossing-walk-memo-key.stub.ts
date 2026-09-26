import { platformCrossingWalkMemoKeyContract } from './platform-crossing-walk-memo-key-contract';
import type { PlatformCrossingWalkMemoKey } from './platform-crossing-walk-memo-key-contract';

export const PlatformCrossingWalkMemoKeyStub = ({
  value,
}: { value?: string } = {}): PlatformCrossingWalkMemoKey =>
  platformCrossingWalkMemoKeyContract.parse(value ?? '/repo/shared.ts\u0000all');
