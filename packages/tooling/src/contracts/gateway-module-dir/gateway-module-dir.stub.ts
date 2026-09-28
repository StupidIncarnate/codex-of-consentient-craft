import { gatewayModuleDirContract } from './gateway-module-dir-contract';
import type { GatewayModuleDir } from './gateway-module-dir-contract';

export const GatewayModuleDirStub = (
  { value }: { value: string } = { value: 'fs__promises' },
): GatewayModuleDir => gatewayModuleDirContract.parse(value);
