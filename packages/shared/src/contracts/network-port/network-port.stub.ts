import { networkPortContract } from './network-port-contract';
import type { NetworkPort } from './network-port-contract';

const DEFAULT_PORT = 5737;

export const NetworkPortStub = (
  { value }: { value: number } = { value: DEFAULT_PORT },
): NetworkPort => networkPortContract.parse(value);
