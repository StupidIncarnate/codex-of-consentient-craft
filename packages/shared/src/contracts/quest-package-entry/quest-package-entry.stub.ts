import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questPackageEntryContract } from './quest-package-entry-contract';
import type { QuestPackageEntry } from './quest-package-entry-contract';

export const QuestPackageEntryStub = ({
  ...props
}: StubArgument<QuestPackageEntry> = {}): QuestPackageEntry => {
  // The kind set tracks whatever single kind the caller asked for, so a stub naming one axis never
  // silently contradicts the other. A caller exercising a multi-kind package passes packageTypes.
  const { packageType = 'library' } = props;

  return questPackageEntryContract.parse({
    name: 'auth-service',
    location: './packages/auth-service',
    changeType: 'edit',
    packageType,
    packageTypes: [packageType],
    ...props,
  });
};
