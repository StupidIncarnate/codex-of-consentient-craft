import { collectedExportContract } from './collected-export-contract';
import type { CollectedExport } from './collected-export-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const CollectedExportStub = ({
  ...props
}: StubArgument<CollectedExport> = {}): CollectedExport =>
  collectedExportContract.parse({
    type: 'VariableDeclaration',
    name: 'testExport',
    isTypeOnly: false,
    ...props,
  });
