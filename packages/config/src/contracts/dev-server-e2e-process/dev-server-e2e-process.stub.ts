import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  devServerE2eProcessContract,
  type DevServerE2eProcess,
} from './dev-server-e2e-process-contract';

export const DevServerE2eProcessStub = ({
  ...props
}: StubArgument<DevServerE2eProcess> = {}): DevServerE2eProcess =>
  devServerE2eProcessContract.parse({
    name: 'api',
    command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
    portRole: 'api',
    readyPath: '/api/guilds',
    ...props,
  });
