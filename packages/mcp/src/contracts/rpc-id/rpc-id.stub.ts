import { rpcIdContract } from './rpc-id-contract';
import type { RpcId } from './rpc-id-contract';

export const RpcIdStub = (
  {
    value,
  }: {
    value: number | string;
  } = {
    value: 1,
  },
): RpcId => rpcIdContract.parse(value);
