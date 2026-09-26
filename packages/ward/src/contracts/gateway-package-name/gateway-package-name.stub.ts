import { gatewayPackageNameContract } from './gateway-package-name-contract';
import type { GatewayPackageName } from './gateway-package-name-contract';

export const GatewayPackageNameStub = ({ value }: { value?: string } = {}): GatewayPackageName =>
  gatewayPackageNameContract.parse(value ?? '@dungeonmaster/node');
