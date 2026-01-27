import { uuidContract } from './uuid-contract';
import type { Uuid } from './uuid-contract';

export const UuidStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): Uuid => uuidContract.parse(value);
