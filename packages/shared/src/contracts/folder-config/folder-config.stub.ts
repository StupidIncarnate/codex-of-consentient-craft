import type { StubArgument } from '../../@types/stub-argument.type';
import { folderConfigContract } from './folder-config-contract';
import type { FolderConfig } from './folder-config-contract';

/**
 * PURPOSE: Creates valid FolderConfig object for testing
 *
 * USAGE:
 * const config = FolderConfigStub({ fileSuffix: '-broker.ts' });
 * // Returns branded FolderConfig object
 */
export const FolderConfigStub = ({ ...props }: StubArgument<FolderConfig> = {}): FolderConfig =>
  folderConfigContract.parse({
    fileSuffix: '-test.ts',
    exportSuffix: 'Test',
    exportCase: 'camelCase',
    folderDepth: 1,
    folderPattern: 'test/[domain]/[domain]-test.ts',
    allowedImports: [],
    disallowAdhocTypes: true,
    requireProxy: false,
    allowsLayerFiles: false,
    allowRegex: false,
    requireContractDeclarations: true,
    meta: {
      purpose: 'Test folder purpose',
      whenToUse: 'For testing',
    },
    ...props,
  });
