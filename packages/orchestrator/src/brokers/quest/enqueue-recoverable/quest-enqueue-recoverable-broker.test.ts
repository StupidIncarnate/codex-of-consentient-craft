import type { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';
import {
  GuildIdStub,
  GuildListItemStub,
  GuildStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questEnqueueRecoverableBroker } from './quest-enqueue-recoverable-broker';
import { questEnqueueRecoverableBrokerProxy } from './quest-enqueue-recoverable-broker.proxy';

type QuestQueueEntry = ReturnType<typeof QuestQueueEntryStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

const GUILD_A_ID = GuildIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
const GUILD_A_SLUG = 'guild-alpha';
const GUILD_B_ID = GuildIdStub({ value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });
const GUILD_B_SLUG = 'guild-beta';

const guildA = GuildStub({
  id: GUILD_A_ID,
  name: 'Guild Alpha',
  urlSlug: GUILD_A_SLUG,
  path: '/home/user/guild-alpha',
  createdAt: '2024-01-15T10:00:00.000Z',
});

const guildB = GuildStub({
  id: GUILD_B_ID,
  name: 'Guild Beta',
  urlSlug: GUILD_B_SLUG,
  path: '/home/user/guild-beta',
  createdAt: '2024-01-15T10:00:00.000Z',
});

const guildAListItem = GuildListItemStub({
  id: GUILD_A_ID,
  name: 'Guild Alpha',
  urlSlug: GUILD_A_SLUG,
  path: '/home/user/guild-alpha',
  valid: true,
});

const guildBListItem = GuildListItemStub({
  id: GUILD_B_ID,
  name: 'Guild Beta',
  urlSlug: GUILD_B_SLUG,
  path: '/home/user/guild-beta',
  valid: true,
});

const noopFindProcess = (): undefined => undefined;

describe('questEnqueueRecoverableBroker', () => {
  describe('recoverable filtering and ordering', () => {
    it('VALID: {2 guilds with scrambled createdAt across recoverable/non-recoverable quests} => enqueues only recoverable in createdAt ascending order regardless of guild', async () => {
      const proxy = questEnqueueRecoverableBrokerProxy();
      proxy.setupPassthrough();

      // Scrambled across guilds: A has newest-and-oldest recoverable, B has middle recoverable.
      // Sort must interleave across guild boundaries.
      const questAOldestRecoverable = QuestStub({
        id: QuestIdStub({ value: 'a-oldest' }),
        folder: '001-a-old',
        status: 'in_progress',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      const questANewestRecoverable = QuestStub({
        id: QuestIdStub({ value: 'a-newest' }),
        folder: '002-a-new',
        status: 'seek_scope',
        createdAt: '2024-01-05T00:00:00.000Z',
      });
      const questAComplete = QuestStub({
        id: QuestIdStub({ value: 'a-complete' }),
        folder: '003-a-done',
        status: 'complete',
        createdAt: '2024-01-02T00:00:00.000Z',
      });

      const questBMiddleRecoverable = QuestStub({
        id: QuestIdStub({ value: 'b-middle' }),
        folder: '001-b-mid',
        status: 'seek_plan',
        createdAt: '2024-01-03T00:00:00.000Z',
      });
      const questBPaused = QuestStub({
        id: QuestIdStub({ value: 'b-paused' }),
        folder: '002-b-paused',
        status: 'paused',
        createdAt: '2024-01-04T00:00:00.000Z',
      });
      const questBOlderRecoverable = QuestStub({
        id: QuestIdStub({ value: 'b-older' }),
        folder: '003-b-older',
        status: 'in_progress',
        createdAt: '2024-01-02T00:00:00.000Z',
      });

      proxy.setupDirectGuildListing({ items: [guildAListItem, guildBListItem] });
      proxy.setupDirectQuestList({
        guildId: GUILD_A_ID,
        quests: [questANewestRecoverable, questAOldestRecoverable, questAComplete],
      });
      proxy.setupDirectQuestList({
        guildId: GUILD_B_ID,
        quests: [questBMiddleRecoverable, questBPaused, questBOlderRecoverable],
      });
      proxy.setupDirectGuild({ guild: guildA });
      proxy.setupDirectGuild({ guild: guildB });

      const enqueueCalls: { entry: QuestQueueEntry }[] = [];
      const enqueue = ({ entry }: { entry: QuestQueueEntry }): void => {
        enqueueCalls.push({ entry });
      };

      const result = await questEnqueueRecoverableBroker({
        enqueue,
        findProcessByQuestId: noopFindProcess,
      });

      expect({
        enqueuedCount: Number(result.enqueuedCount),
        questIds: enqueueCalls.map((c) => c.entry.questId),
        guildIds: enqueueCalls.map((c) => c.entry.guildId),
        guildSlugs: enqueueCalls.map((c) => c.entry.guildSlug),
        statuses: enqueueCalls.map((c) => c.entry.status),
      }).toStrictEqual({
        enqueuedCount: 4,
        // Order: A-oldest (Jan 1), B-older (Jan 2), B-middle (Jan 3), A-newest (Jan 5)
        questIds: [
          questAOldestRecoverable.id,
          questBOlderRecoverable.id,
          questBMiddleRecoverable.id,
          questANewestRecoverable.id,
        ],
        guildIds: [GUILD_A_ID, GUILD_B_ID, GUILD_B_ID, GUILD_A_ID],
        guildSlugs: [GUILD_A_SLUG, GUILD_B_SLUG, GUILD_B_SLUG, GUILD_A_SLUG],
        statuses: ['in_progress', 'in_progress', 'seek_plan', 'seek_scope'],
      });
    });

    it('VALID: {all quests non-recoverable} => enqueue not called, returns EnqueuedCount(0)', async () => {
      const proxy = questEnqueueRecoverableBrokerProxy();
      proxy.setupPassthrough();

      const questComplete = QuestStub({
        id: QuestIdStub({ value: 'complete' }),
        folder: '001-done',
        status: 'complete',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      const questPaused = QuestStub({
        id: QuestIdStub({ value: 'paused' }),
        folder: '002-paused',
        status: 'paused',
        createdAt: '2024-01-02T00:00:00.000Z',
      });

      proxy.setupDirectGuildListing({ items: [guildAListItem] });
      proxy.setupDirectQuestList({
        guildId: GUILD_A_ID,
        quests: [questComplete, questPaused],
      });
      proxy.setupDirectGuild({ guild: guildA });

      const enqueueCalls: { entry: QuestQueueEntry }[] = [];
      const enqueue = ({ entry }: { entry: QuestQueueEntry }): void => {
        enqueueCalls.push({ entry });
      };

      const result = await questEnqueueRecoverableBroker({
        enqueue,
        findProcessByQuestId: noopFindProcess,
      });

      expect({
        enqueuedCount: Number(result.enqueuedCount),
        callCount: enqueueCalls.length,
      }).toStrictEqual({ enqueuedCount: 0, callCount: 0 });
    });

    it('VALID: {quest already has live process} => skip that quest, enqueue only the idle recoverable', async () => {
      const proxy = questEnqueueRecoverableBrokerProxy();
      proxy.setupPassthrough();

      const runningQuestId = QuestIdStub({ value: 'running-quest' });
      const idleQuestId = QuestIdStub({ value: 'idle-quest' });
      const liveProcessId = ProcessIdStub({ value: 'proc-live' });

      const runningQuest = QuestStub({
        id: runningQuestId,
        folder: '001-running',
        status: 'in_progress',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      const idleQuest = QuestStub({
        id: idleQuestId,
        folder: '002-idle',
        status: 'seek_scope',
        createdAt: '2024-01-02T00:00:00.000Z',
      });

      proxy.setupDirectGuildListing({ items: [guildAListItem] });
      proxy.setupDirectQuestList({ guildId: GUILD_A_ID, quests: [runningQuest, idleQuest] });
      proxy.setupDirectGuild({ guild: guildA });

      const enqueueCalls: { entry: QuestQueueEntry }[] = [];
      const enqueue = ({ entry }: { entry: QuestQueueEntry }): void => {
        enqueueCalls.push({ entry });
      };
      const livingProcessByQuestId = new Map<QuestId, ReturnType<typeof ProcessIdStub>>([
        [runningQuestId, liveProcessId],
      ]);
      const findProcessByQuestId = ({ questId }: { questId: QuestId }): unknown =>
        livingProcessByQuestId.get(questId);

      const result = await questEnqueueRecoverableBroker({ enqueue, findProcessByQuestId });

      expect({
        enqueuedCount: Number(result.enqueuedCount),
        questIds: enqueueCalls.map((c) => c.entry.questId),
      }).toStrictEqual({
        enqueuedCount: 1,
        questIds: [idleQuestId],
      });
    });
  });

  describe('enqueue entry shape', () => {
    it('VALID: {single recoverable quest with questSource} => entry contains all quest fields and ISO enqueuedAt', async () => {
      const proxy = questEnqueueRecoverableBrokerProxy();
      proxy.setupPassthrough();

      const quest = QuestStub({
        id: QuestIdStub({ value: 'shape-quest' }),
        folder: '001-shape',
        title: 'Shape Test Quest',
        status: 'seek_plan',
        createdAt: '2024-01-01T00:00:00.000Z',
        questSource: 'smoketest-mcp',
      });

      proxy.setupDirectGuildListing({ items: [guildAListItem] });
      proxy.setupDirectQuestList({ guildId: GUILD_A_ID, quests: [quest] });
      proxy.setupDirectGuild({ guild: guildA });

      const enqueueCalls: { entry: QuestQueueEntry }[] = [];
      const enqueue = ({ entry }: { entry: QuestQueueEntry }): void => {
        enqueueCalls.push({ entry });
      };

      await questEnqueueRecoverableBroker({
        enqueue,
        findProcessByQuestId: noopFindProcess,
      });

      const entries = enqueueCalls.map((c) => c.entry);
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
      const enqueuedAtMatches = entries.map((e) => isoRegex.test(String(e.enqueuedAt)));

      expect({
        length: entries.length,
        questIds: entries.map((e) => e.questId),
        guildIds: entries.map((e) => e.guildId),
        guildSlugs: entries.map((e) => e.guildSlug),
        questTitles: entries.map((e) => e.questTitle),
        statuses: entries.map((e) => e.status),
        questSources: entries.map((e) => e.questSource),
        enqueuedAtMatches,
      }).toStrictEqual({
        length: 1,
        questIds: [quest.id],
        guildIds: [GUILD_A_ID],
        guildSlugs: [GUILD_A_SLUG],
        questTitles: ['Shape Test Quest'],
        statuses: ['seek_plan'],
        questSources: ['smoketest-mcp'],
        enqueuedAtMatches: [true],
      });
    });

    it('VALID: {recoverable quest without questSource} => entry omits questSource key entirely', async () => {
      const proxy = questEnqueueRecoverableBrokerProxy();
      proxy.setupPassthrough();

      const quest = QuestStub({
        id: QuestIdStub({ value: 'no-source-quest' }),
        folder: '001-no-source',
        title: 'No Source Quest',
        status: 'in_progress',
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      proxy.setupDirectGuildListing({ items: [guildAListItem] });
      proxy.setupDirectQuestList({ guildId: GUILD_A_ID, quests: [quest] });
      proxy.setupDirectGuild({ guild: guildA });

      const enqueueCalls: { entry: QuestQueueEntry }[] = [];
      const enqueue = ({ entry }: { entry: QuestQueueEntry }): void => {
        enqueueCalls.push({ entry });
      };

      await questEnqueueRecoverableBroker({
        enqueue,
        findProcessByQuestId: noopFindProcess,
      });

      const entries = enqueueCalls.map((c) => c.entry);
      const questSourcePresence = entries.map((e) => 'questSource' in e);

      expect({
        totalEnqueued: entries.length,
        questSourcePresence,
      }).toStrictEqual({
        totalEnqueued: 1,
        questSourcePresence: [false],
      });
    });
  });
});
