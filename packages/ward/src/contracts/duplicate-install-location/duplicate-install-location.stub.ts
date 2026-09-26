import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  duplicateInstallLocationContract,
  type DuplicateInstallLocation,
} from './duplicate-install-location-contract';

export const DuplicateInstallLocationStub = ({
  ...props
}: StubArgument<DuplicateInstallLocation> = {}): DuplicateInstallLocation =>
  duplicateInstallLocationContract.parse({
    location: 'packages/@gateway/npm/node_modules/@mantine/core',
    version: '8.3.18',
    ...props,
  });
