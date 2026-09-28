import { adapterCallerContract } from './adapter-caller-contract';
import type { AdapterCaller } from './adapter-caller-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const AdapterCallerStub = ({ ...props }: StubArgument<AdapterCaller> = {}): AdapterCaller =>
  adapterCallerContract.parse({
    file: 'packages/example/src/brokers/thing/read/thing-read-broker.ts',
    proxyFile: 'packages/example/src/brokers/thing/read/thing-read-broker.proxy.ts',
    composedBy: [],
    catchAll: [],
    ...props,
  });
