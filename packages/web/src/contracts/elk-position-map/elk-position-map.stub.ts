import type { StubArgument } from '@dungeonmaster/shared/@types';

import { elkPositionMapContract } from './elk-position-map-contract';
import type { ElkPositionMap } from './elk-position-map-contract';

export const ElkPositionMapStub = (
  { ...props }: StubArgument<ElkPositionMap> = { 'login-page': { x: 0, y: 0 } },
): ElkPositionMap => elkPositionMapContract.parse({ ...props });
