import type { StubArgument } from '@dungeonmaster/shared/@types';
import { proxyImportEdgeContract } from './proxy-import-edge-contract';
import type { ProxyImportEdge } from './proxy-import-edge-contract';

export const ProxyImportEdgeStub = ({
  ...props
}: StubArgument<ProxyImportEdge> = {}): ProxyImportEdge =>
  proxyImportEdgeContract.parse({
    kind: 'import',
    importPath: './test.proxy',
    names: null,
    ...props,
  });
