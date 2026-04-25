import {
  dungeonmasterHomeCwdContract,
  type DungeonmasterHomeCwd,
} from './dungeonmaster-home-cwd-contract';

export const DungeonmasterHomeCwdStub = ({ value }: { value: unknown }): DungeonmasterHomeCwd =>
  dungeonmasterHomeCwdContract.parse(value);
