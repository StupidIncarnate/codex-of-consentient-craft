import type { StubArgument } from '@dungeonmaster/shared/@types';
import { gatewayConsumerPackageJsonContract } from './gateway-consumer-package-json-contract';
import type { GatewayConsumerPackageJson } from './gateway-consumer-package-json-contract';

export const GatewayConsumerPackageJsonStub = ({
  ...props
}: StubArgument<GatewayConsumerPackageJson> = {}): GatewayConsumerPackageJson =>
  gatewayConsumerPackageJsonContract.parse({
    name: '@dungeonmaster/hooks',
    ...props,
  });
