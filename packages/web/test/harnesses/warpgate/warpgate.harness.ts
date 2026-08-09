/**
 * PURPOSE: Seeds the post-execution merge surface (blocked/complete/merging/merged quests
 * carrying a `warpgate` work item, and — for the follow-up-tab specs — a `tavernkeeper` item
 * with a multi-turn transcript already on disk) so each warpgate-merge spec states only what
 * varies: the quest's status and the warpgate/tavernkeeper items' own status.
 *
 * USAGE:
 * const warpgate = warpgateHarness({ request, guildPath: GUILD_PATH });
 * const { guildId, urlSlug, questId, questFolder, questFilePath } = await warpgate.setup({
 *   guildName: 'Warpgate Guild',
 *   title: 'Warpgate Quest',
 * });
 * warpgate.seedWarpgateQuest({ questId, questFolder, questFilePath, status: 'merging', warpgateStatus: 'in_progress' });
 * warpgate.seedFollowupTurns({ sessionId, turns: [{ role: 'user', text: 'hi' }, { role: 'assistant', text: 'hello' }] });
 */
import type { APIRequestContext } from '@playwright/test';

import {
  AssistantTextStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import type {
  FilePath,
  GuildId,
  QuestId,
  UrlSlug,
} from '@dungeonmaster/shared/contracts';

import { guildHarness } from '../guild/guild.harness';
import { questHarness } from '../quest/quest.harness';
import { sessionHarness } from '../session/session.harness';

// Every id here must be hex-only: questContract validates workItem and operation ids as uuids,
// so a single non-hex character makes the whole seeded quest.json unparseable — the server drops
// the quest, the queue comes back empty and the execution panel never mounts, which surfaces as
// an "element not found" on the first locator rather than as a validation error.
const PRIOR_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000a1';
const WARPGATE_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000a2';
const TAVERNKEEPER_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000a3';
const WARPGATE_OP_ID = '00000000-0000-4000-8000-0000000000a9';

export const warpgateHarness = ({
  request,
  guildPath,
}: {
  request: APIRequestContext;
  guildPath: string;
}): {
  setup: (params: {
    guildName: string;
    title: string;
  }) => Promise<{
    guildId: GuildId;
    urlSlug: UrlSlug;
    questId: QuestId;
    questFolder: QuestId;
    questFilePath: FilePath;
  }>;
  createQuestInGuild: (params: {
    guildId: GuildId;
    title: string;
  }) => Promise<{
    questId: QuestId;
    questFolder: QuestId;
    questFilePath: FilePath;
  }>;
  seedWarpgateQuest: (params: {
    questId: string;
    questFolder: string;
    questFilePath: string;
    title?: string;
    status: string;
    warpgateStatus: string;
    tavernkeeperSessionId?: string;
  }) => void;
  seedFollowupTurns: (params: {
    sessionId: string;
    turns: readonly { role: 'user' | 'assistant'; text: string }[];
  }) => void;
} => {
  const guilds = guildHarness({ request });
  const quests = questHarness({ request });
  const sessions = sessionHarness({ guildPath });

  const setup = async ({
    guildName,
    title,
  }: {
    guildName: string;
    title: string;
  }): Promise<{
    guildId: GuildId;
    urlSlug: UrlSlug;
    questId: QuestId;
    questFolder: QuestId;
    questFilePath: FilePath;
  }> => {
    const guild = await guilds.createGuild({ name: guildName, path: guildPath });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });
    const created = await quests.createQuest({
      guildId: String(guildId),
      title,
      userRequest: 'Build the feature',
    });
    return {
      guildId,
      urlSlug,
      questId: created.questId,
      questFolder: created.questFolder,
      questFilePath: created.filePath,
    };
  };

  // Creates a SECOND quest inside a guild `setup` has already made. Two quests that are compared
  // against each other — the complete banner against the merged banner — must SHARE one guild:
  // the guilds API registers one guild per PATH, so a second createGuild against the same path
  // answers an error body carrying no id, and the quest create that follows it then fails
  // contract validation rather than reporting the guild collision that actually caused it.
  const createQuestInGuild = async ({
    guildId,
    title,
  }: {
    guildId: GuildId;
    title: string;
  }): Promise<{
    questId: QuestId;
    questFolder: QuestId;
    questFilePath: FilePath;
  }> => {
    const created = await quests.createQuest({
      guildId: String(guildId),
      title,
      userRequest: 'Build the feature',
    });
    return {
      questId: created.questId,
      questFolder: created.questFolder,
      questFilePath: created.filePath,
    };
  };

  // Writes a quest carrying a prior COMPLETE codeweaver item (so the warpgate row is never the
  // only row — a matching signal for anything that reads visibleWorkItems order), the warpgate
  // item itself at the caller's status, its linked warpgate operation item, and — only when
  // `tavernkeeperSessionId` is passed — a tavernkeeper item bound to that session so the
  // FOLLOW-UP tab's transcript resolves via `entriesBySession`.
  const seedWarpgateQuest = ({
    questId,
    questFolder,
    questFilePath,
    title = 'E2E Warpgate Quest',
    status,
    warpgateStatus,
    tavernkeeperSessionId,
  }: {
    questId: string;
    questFolder: string;
    questFilePath: string;
    title?: string;
    status: string;
    warpgateStatus: string;
    tavernkeeperSessionId?: string;
  }): void => {
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      title,
      status,
      operations: [
        {
          id: WARPGATE_OP_ID,
          role: 'warpgate',
          text: 'Merge the quest branch home',
          status: warpgateStatus === 'complete' ? 'complete' : 'in_progress',
          locked: true,
        },
      ],
      workItems: [
        {
          id: PRIOR_WORK_ITEM_ID,
          role: 'codeweaver',
          status: 'complete',
        },
        {
          id: WARPGATE_WORK_ITEM_ID,
          role: 'warpgate',
          status: warpgateStatus,
          relatedDataItems: [`operations/${WARPGATE_OP_ID}`],
        },
        ...(tavernkeeperSessionId === undefined
          ? []
          : [
              {
                id: TAVERNKEEPER_WORK_ITEM_ID,
                role: 'tavernkeeper',
                status: 'complete',
                sessionId: tavernkeeperSessionId,
              },
            ]),
      ],
    });
  };

  // Multi-turn tavernkeeper session so the FOLLOW-UP tab has >=2 PRIOR turns to survive a
  // status change — one turn alone cannot distinguish "the transcript survived" from "the last
  // message survived".
  const seedFollowupTurns = ({
    sessionId,
    turns,
  }: {
    sessionId: string;
    turns: readonly { role: 'user' | 'assistant'; text: string }[];
  }): void => {
    sessions.createMultiEntrySessionFile({
      sessionId,
      lines: turns.map((turn) =>
        JSON.stringify(
          turn.role === 'user'
            ? UserTextStringStreamLineStub({ message: { role: 'user', content: turn.text } })
            : AssistantTextStreamLineStub({
                message: { role: 'assistant', content: [{ type: 'text', text: turn.text }] },
              }),
        ),
      ),
    });
  };

  return {
    setup,
    createQuestInGuild,
    seedWarpgateQuest,
    seedFollowupTurns,
  };
};
