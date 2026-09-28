import { spawnOptionsEnvNameContract } from './spawn-options-env-name-contract';
import type { SpawnOptionsEnvName } from './spawn-options-env-name-contract';

export const SpawnOptionsEnvNameStub = (
  { value }: { value: string } = { value: 'CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS' },
): SpawnOptionsEnvName => spawnOptionsEnvNameContract.parse(value);
