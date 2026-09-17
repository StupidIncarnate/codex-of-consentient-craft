import { profilePoolSizeContract } from './profile-pool-size-contract';
import type { ProfilePoolSize } from './profile-pool-size-contract';

export const ProfilePoolSizeStub = ({ value }: { value: number } = { value: 1 }): ProfilePoolSize =>
  profilePoolSizeContract.parse(value);
