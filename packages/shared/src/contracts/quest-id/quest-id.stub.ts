import { questIdContract } from './quest-id-contract';

type QuestId = ReturnType<typeof questIdContract.parse>;

export const QuestIdStub = ({ value }: { value: string } = { value: 'add-auth' }): QuestId =>
  questIdContract.parse(value);
