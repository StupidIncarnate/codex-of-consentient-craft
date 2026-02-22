import { rpcMethodContract } from './rpc-method-contract';
import type { RpcMethod } from './rpc-method-contract';

export const RpcMethodStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'initialize',
  },
): RpcMethod => rpcMethodContract.parse(value);
