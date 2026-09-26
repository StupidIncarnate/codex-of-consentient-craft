import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  gatewayPackageNamesContract,
  type GatewayPackageNames,
} from './gateway-package-names-contract';

export const GatewayPackageNamesStub = ({
  ...props
}: StubArgument<GatewayPackageNames> = {}): GatewayPackageNames =>
  gatewayPackageNamesContract.parse({
    node: '@dungeonmaster/node',
    bin: '@dungeonmaster/bin',
    browser: '@dungeonmaster/browser',
    ...props,
  });
