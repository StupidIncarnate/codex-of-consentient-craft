import { questContract } from '../quest/quest-contract';

type QuestId = ReturnType<typeof questContract.shape.id.parse>;

const questIdContract = questContract.shape.id;

export const QuestIdStub = ({ value }: { value: string } = { value: 'add-auth' }): QuestId =>
  questIdContract.parse(value);
