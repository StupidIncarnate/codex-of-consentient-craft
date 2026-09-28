import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

// The guildId segment is never known to this proxy ahead of a real call — every caller hands
// `setupQuestsPath` a finished `questsPath`, never the guildId that produced it — so it is matched
// by predicate rather than by value, the same shape 4863ee390's `isQuestIdSegment` uses. The other
// three segments (homePath, guildsDir, questsDir) are literal, which already pins the address to
// exactly this broker's own 4-arg join and nothing else's.
const isGuildIdSegment = (value: unknown): boolean => typeof value === 'string';

export const questResolveQuestsPathBrokerProxy = (): {
  setupQuestsPath: (params: { homeDir: string; homePath: FilePath; questsPath: FilePath }) => void;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });

  return {
    setupQuestsPath: ({
      homeDir,
      homePath,
      questsPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      questsPath: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      joinHandle
        .calledWith([
          homePath,
          dungeonmasterHomeStatics.paths.guildsDir,
          isGuildIdSegment,
          dungeonmasterHomeStatics.paths.questsDir,
        ])
        .returns(questsPath);
    },
  };
};
