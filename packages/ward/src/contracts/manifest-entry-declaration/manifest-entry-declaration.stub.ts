import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  manifestEntryDeclarationContract,
  type ManifestEntryDeclaration,
} from './manifest-entry-declaration-contract';

export const ManifestEntryDeclarationStub = ({
  ...props
}: StubArgument<ManifestEntryDeclaration> = {}): ManifestEntryDeclaration =>
  manifestEntryDeclarationContract.parse({
    field: 'main',
    declaredPath: 'dist/index.js',
    ...props,
  });
