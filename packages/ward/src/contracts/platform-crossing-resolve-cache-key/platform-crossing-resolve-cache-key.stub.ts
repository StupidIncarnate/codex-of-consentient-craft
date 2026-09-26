import { platformCrossingResolveCacheKeyContract } from './platform-crossing-resolve-cache-key-contract';
import type { PlatformCrossingResolveCacheKey } from './platform-crossing-resolve-cache-key-contract';

export const PlatformCrossingResolveCacheKeyStub = ({
  value,
}: { value?: string } = {}): PlatformCrossingResolveCacheKey =>
  platformCrossingResolveCacheKeyContract.parse(value ?? '/repo/entry.ts\u0000./helper');
