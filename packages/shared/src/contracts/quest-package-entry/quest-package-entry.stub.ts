import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questPackageEntryContract } from './quest-package-entry-contract';
import type { QuestPackageEntry } from './quest-package-entry-contract';

export const QuestPackageEntryStub = ({
  ...props
}: StubArgument<QuestPackageEntry> = {}): QuestPackageEntry =>
  questPackageEntryContract.parse({
    name: 'auth-service',
    location: './packages/auth-service',
    changeType: 'edit',
    packageType: 'library',
    ...props,
  });
