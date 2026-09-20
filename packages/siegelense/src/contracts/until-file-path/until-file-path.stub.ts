import { untilFilePathContract } from './until-file-path-contract';
import type { UntilFilePath } from './until-file-path-contract';

export const UntilFilePathStub = (
  { value }: { value: string } = { value: 'guilds/g1/quests/q1/quest.json' },
): UntilFilePath => untilFilePathContract.parse(value);
