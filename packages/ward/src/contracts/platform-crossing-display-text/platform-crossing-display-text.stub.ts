import { platformCrossingDisplayTextContract } from './platform-crossing-display-text-contract';
import type { PlatformCrossingDisplayText } from './platform-crossing-display-text-contract';

export const PlatformCrossingDisplayTextStub = ({
  value,
}: { value?: string } = {}): PlatformCrossingDisplayText =>
  platformCrossingDisplayTextContract.parse(value ?? 'platform-crossing: PASS');
