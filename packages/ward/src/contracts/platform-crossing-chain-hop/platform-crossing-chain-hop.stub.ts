import { platformCrossingChainHopContract } from './platform-crossing-chain-hop-contract';
import type { PlatformCrossingChainHop } from './platform-crossing-chain-hop-contract';

export const PlatformCrossingChainHopStub = ({
  value,
}: { value?: string } = {}): PlatformCrossingChainHop =>
  platformCrossingChainHopContract.parse(value ?? '@dungeonmaster/node/fs');
