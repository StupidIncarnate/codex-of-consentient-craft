import { unitMarkContract } from './unit-mark-contract';
import type { UnitMark } from './unit-mark-contract';

export const UnitMarkStub = ({ value }: { value?: UnitMark } = {}): UnitMark =>
  unitMarkContract.parse(value ?? 'met');
