import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questNewBodyContract } from './quest-new-body-contract';
import type { QuestNewBody } from './quest-new-body-contract';

export const QuestNewBodyStub = ({ ...props }: StubArgument<QuestNewBody> = {}): QuestNewBody =>
  questNewBodyContract.parse({
    message: 'Build the login flow',
    ...props,
  });
