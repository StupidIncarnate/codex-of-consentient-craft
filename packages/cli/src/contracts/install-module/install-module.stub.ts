import type { StubArgument } from '@dungeonmaster/shared/@types';
import { InstallResultStub } from '@dungeonmaster/shared/contracts';
import { installModuleContract } from './install-module-contract';
import type { InstallModule } from './install-module-contract';

export const InstallModuleStub = ({ ...props }: StubArgument<InstallModule> = {}): InstallModule =>
  installModuleContract.parse({
    StartInstall: async () =>
      Promise.resolve(
        InstallResultStub({
          value: { packageName: '@dungeonmaster/cli', success: true, action: 'created' },
        }),
      ),
    ...props,
  });
