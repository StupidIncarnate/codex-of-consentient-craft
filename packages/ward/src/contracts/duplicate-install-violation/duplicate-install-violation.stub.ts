import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  duplicateInstallViolationContract,
  type DuplicateInstallViolation,
} from './duplicate-install-violation-contract';

export const DuplicateInstallViolationStub = ({
  ...props
}: StubArgument<DuplicateInstallViolation> = {}): DuplicateInstallViolation =>
  duplicateInstallViolationContract.parse({
    packageName: '@mantine/core',
    locations: [
      { location: 'packages/@gateway/npm/node_modules/@mantine/core', version: '8.3.18' },
      { location: 'packages/web/node_modules/@mantine/core', version: '8.3.14' },
    ],
    ...props,
  });
