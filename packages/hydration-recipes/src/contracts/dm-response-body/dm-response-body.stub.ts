import { dmResponseBodyContract } from './dm-response-body-contract';
import type { DmResponseBody } from './dm-response-body-contract';

export const DmResponseBodyStub = ({
  value = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
}: { value?: DmResponseBody } = {}): DmResponseBody => dmResponseBodyContract.parse(value);
