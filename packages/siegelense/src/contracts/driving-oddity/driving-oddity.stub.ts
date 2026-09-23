import type { StubArgument } from '@dungeonmaster/shared/@types';

import { drivingOddityContract } from './driving-oddity-contract';
import type { DrivingOddity } from './driving-oddity-contract';

export const DrivingOddityStub = ({ ...props }: StubArgument<DrivingOddity> = {}): DrivingOddity =>
  drivingOddityContract.parse({
    key: 'GUILD_ADD_MODAL',
    line: 'Clicking the label does nothing on this button — click the wrapper instead.',
    kind: 'quirk',
    ...props,
  });
