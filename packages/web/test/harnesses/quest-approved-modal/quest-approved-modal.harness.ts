/**
 * PURPOSE: Sets up a quest with session and guild for approved-modal E2E tests
 *
 * USAGE:
 * const harness = questApprovedModalHarness({ sessions, guildPath: GUILD_PATH });
 * const result = await harness.setupTest({ request, guildName, sessionId, status });
 */
import type { APIRequestContext } from '@playwright/test';
import type { QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';

import { guildHarness } from '../guild/guild.harness';
import { questHarness } from '../quest/quest.harness';
import type { sessionHarness } from '../session/session.harness';

// A feature quest cannot transition to `approved` unless its operations ledger carries at least one
// `role: codeweaver` item (enforced by hasQuestGateContentGuard). The APPROVE-gate specs patch
// review_observables → approved, so the seed MUST include a codeweaver operation or the modify
// broker rejects the PATCH and the quest never reaches approved (no modal).
const DEFAULT_APPROVAL_OPERATIONS = [
  {
    id: '00000000-0000-4000-8000-0000000000d1',
    role: 'codeweaver',
    text: 'core: build the feature',
    status: 'pending',
  },
];

export const questApprovedModalHarness = ({
  sessions,
  guildPath,
}: {
  sessions: ReturnType<typeof sessionHarness>;
  guildPath: string;
}): {
  setupTest: (params: {
    request: APIRequestContext;
    guildName: string;
    sessionId: string;
    status: string;
    operations?: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      wardMode?: string;
    }[];
  }) => Promise<{
    guild: Record<PropertyKey, unknown>;
    questId: QuestId;
    urlSlug: UrlSlug;
    quests: ReturnType<typeof questHarness>;
  }>;
} => ({
  setupTest: async ({
    request,
    guildName,
    sessionId,
    status,
    operations = DEFAULT_APPROVAL_OPERATIONS,
  }: {
    request: APIRequestContext;
    guildName: string;
    sessionId: string;
    status: string;
    operations?: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      wardMode?: string;
    }[];
  }): Promise<{
    guild: Record<PropertyKey, unknown>;
    questId: QuestId;
    urlSlug: UrlSlug;
    quests: ReturnType<typeof questHarness>;
  }> => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const guild = await guilds.createGuild({ name: guildName, path: guildPath });
    const guildId = String(guild.id);

    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Approved Modal Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status,
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
      operations,
    });

    const urlSlug = guilds.extractUrlSlug({ guild });

    return { guild, questId, urlSlug, quests };
  },
});
