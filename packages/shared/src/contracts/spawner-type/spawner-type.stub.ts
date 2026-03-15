import { spawnerTypeContract } from './spawner-type-contract';
import type { SpawnerType } from './spawner-type-contract';

export const SpawnerTypeStub = ({ value }: { value?: SpawnerType } = {}): SpawnerType =>
  spawnerTypeContract.parse(value ?? 'agent');
