import { gatewayExportContract } from './gateway-export-contract';
import type { GatewayExport } from './gateway-export-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const GatewayExportStub = ({ ...props }: StubArgument<GatewayExport> = {}): GatewayExport =>
  gatewayExportContract.parse({
    importPath: '#gateway/node/fs__promises',
    name: 'readFile',
    match: 'exact',
    ...props,
  });
