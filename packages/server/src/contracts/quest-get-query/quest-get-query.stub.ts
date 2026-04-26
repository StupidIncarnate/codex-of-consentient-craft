import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questGetQueryContract } from './quest-get-query-contract';
import type { QuestGetQuery } from './quest-get-query-contract';

export const QuestGetQueryStub = ({ ...props }: StubArgument<QuestGetQuery> = {}): QuestGetQuery =>
  questGetQueryContract.parse({ ...props });
