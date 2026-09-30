import { questContract } from '../quest/quest-contract';

type QuestId = ReturnType<typeof questContract.shape.id.parse>;

export const QuestIdStub = ({ value }: { value: string } = { value: 'add-auth' }): QuestId =>
  questContract.shape.id.parse(value);
