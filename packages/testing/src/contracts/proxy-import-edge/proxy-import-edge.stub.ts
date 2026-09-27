import type { StubArgument } from '@dungeonmaster/shared/@types';
import { proxyImportEdgeContract } from './proxy-import-edge-contract';
import type { ProxyImportEdge } from './proxy-import-edge-contract';
import { ImportPathStub } from '../import-path/import-path.stub';

export const ProxyImportEdgeStub = ({
  ...props
}: StubArgument<ProxyImportEdge> = {}): ProxyImportEdge =>
  proxyImportEdgeContract.parse({
    kind: 'import',
    importPath: ImportPathStub({ value: './test.proxy' }),
    names: null,
    ...props,
  });
