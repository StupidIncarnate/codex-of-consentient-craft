import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questStartBodyContract } from './quest-start-body-contract';
import type { QuestStartBody } from './quest-start-body-contract';

export const QuestStartBodyStub = ({
  ...props
}: StubArgument<QuestStartBody> = {}): QuestStartBody =>
  questStartBodyContract.parse({
    ...props,
  });
