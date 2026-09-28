import { gatewayImplementationContract } from './gateway-implementation-contract';
import type { GatewayImplementation } from './gateway-implementation-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { OutsideCallStub } from '../outside-call/outside-call.stub';

export const GatewayImplementationStub = ({
  ...props
}: StubArgument<GatewayImplementation> = {}): GatewayImplementation =>
  gatewayImplementationContract.parse({
    importPath: '#gateway/node/fs__promises',
    name: 'readFile',
    moduleDir: 'fs__promises',
    outsideCalls: [OutsideCallStub()],
    ...props,
  });
