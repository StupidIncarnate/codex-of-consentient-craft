/**
 * PURPOSE: Seeds TWO review_flows quests in one guild that share one flow diagram, opens either of
 * them, and exposes the localStorage writes/reads, the full-page reload and the popover gestures the
 * comment-queue-storage-lifecycle e2e walks. A real page reload, a real route-to-route navigation
 * and a real localStorage only exist in a browser, so the mechanics live here and the scenario file
 * asserts what they return. Two quests is the point: this flow's whole subject is that quest A's
 * queue and quest B's queue never reach across the per-quest key boundary.
 *
 * USAGE:
 * const lifecycle = commentQueueLifecycleHarness({ page, request, guildPath, sessions });
 * await lifecycle.seedTwoQuests({ guildName: 'Lifecycle Guild' });
 * await lifecycle.openQuest({ which: 'first' });
 * await lifecycle.writeQueue({ which: 'first', entries: [{ nodeId: LIFECYCLE_FIRST_NODE_ID, text: 'note', ageDays: 8 }] });
 * await lifecycle.reloadQuest();
 * expect(await lifecycle.readQueue({ which: 'first' })).toStrictEqual([]);
 */
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import { navigationHarness } from '../navigation/navigation.harness';
import { guildHarness } from '../guild/guild.harness';
import { questHarness } from '../quest/quest.harness';
import type { sessionHarness } from '../session/session.harness';

const PANEL_TIMEOUT = 5_000;
const CANVAS_TIMEOUT = 10_000;

// The localStorage key prefix and the purge window from commentQueueStatics. Harness files cannot
// import statics values, so the literals are duplicated here; commentQueueStatics.storage.keyPrefix
// and commentQueueStatics.expiry are their source of truth, and every assertion below fails loudly
// if the two ever drift (an entry seeded 8 days old would stop being purged).
const QUEUE_KEY_PREFIX = 'dungeonmaster-quest-comments-';
const EXPIRY_DAYS = 7;
const MS_PER_DAY = 86_400_000;

// Ids, labels and text the scenario file selects and asserts on. Exported so the scenario references
// the seeded flow rather than inlining strings that could drift away from it.
export const LIFECYCLE_FLOW_ID = 'comment-lifecycle-flow';
export const LIFECYCLE_FIRST_NODE_ID = 'first-box';
export const LIFECYCLE_FIRST_NODE_LABEL = 'First Box';
export const LIFECYCLE_SECOND_NODE_ID = 'second-box';
export const LIFECYCLE_SECOND_NODE_LABEL = 'Second Box';
export const LIFECYCLE_OBSERVABLE_ID = 'first-box-paints';
export const LIFECYCLE_OBSERVABLE_TEXT = 'the first box paints its comment button';

// readQueue swaps each entry's createdAt for whichever side of the purge window it falls on, so the
// scenario asserts the WHOLE entry with toStrictEqual and still gets the age check: every entry that
// survives a mount must read back as within the window. A raw timestamp passthrough could not be
// asserted at all — the harness mints it from the seed instant, which the scenario cannot predict.
export const LIFECYCLE_WITHIN_WINDOW = '<within-expiry-window>';
export const LIFECYCLE_PAST_WINDOW = '<past-expiry-window>';

// Two commentable action nodes plus a terminal, and one assertion card branching off the first node.
// Two node cards is what lets one quest hold two queued comments on two different boxes (the count
// in the queue bar is then a real total, not a stand-in for one), and the assertion card is what
// proves an observable-anchored entry restores through a reload with its observableId intact.
const LIFECYCLE_FLOW = {
  id: LIFECYCLE_FLOW_ID,
  name: 'Comment Lifecycle Flow',
  flowType: 'runtime',
  entryPoint: LIFECYCLE_FIRST_NODE_ID,
  exitPoints: ['queue-restored'],
  nodes: [
    {
      id: LIFECYCLE_FIRST_NODE_ID,
      label: LIFECYCLE_FIRST_NODE_LABEL,
      type: 'action',
      packages: ['auth-service'],
      observables: [
        {
          id: LIFECYCLE_OBSERVABLE_ID,
          type: 'ui-state',
          package: 'auth-service',
          description: LIFECYCLE_OBSERVABLE_TEXT,
        },
      ],
    },
    {
      id: LIFECYCLE_SECOND_NODE_ID,
      label: LIFECYCLE_SECOND_NODE_LABEL,
      type: 'action',
      packages: ['auth-service'],
      observables: [],
    },
    {
      id: 'queue-restored',
      label: 'Queue Restored',
      type: 'terminal',
      packages: ['auth-service'],
      observables: [],
    },
  ],
  edges: [
    { id: 'first-to-second', from: LIFECYCLE_FIRST_NODE_ID, to: LIFECYCLE_SECOND_NODE_ID },
    { id: 'second-to-restored', from: LIFECYCLE_SECOND_NODE_ID, to: 'queue-restored' },
  ],
};

const FLOW_NODE_COUNT = LIFECYCLE_FLOW.nodes.length;
const OBSERVABLE_NODE_COUNT = LIFECYCLE_FLOW.nodes.reduce(
  (sum, node) => sum + node.observables.length,
  0,
);

type QueueEntryRecord = Record<PropertyKey, unknown>;

// Browser-evaluated: reads or writes one localStorage key. Return types are inferred so these
// signatures carry no raw-primitive annotation.
const READ_KEY_BROWSER_FN = (key: string) => globalThis.localStorage.getItem(key);

const WRITE_KEY_BROWSER_FN = ({ key, value }: { key: string; value: string }): void => {
  globalThis.localStorage.setItem(key, value);
};

export const commentQueueLifecycleHarness = ({
  page,
  request,
  guildPath,
  sessions,
}: {
  page: Page;
  request: APIRequestContext;
  guildPath: string;
  sessions: ReturnType<typeof sessionHarness>;
}): {
  seedTwoQuests: (params: { guildName: string }) => Promise<void>;
  openQuest: (params: { which: 'first' | 'second' }) => Promise<void>;
  reloadQuest: () => Promise<void>;
  writeQueue: (params: {
    which: 'first' | 'second';
    entries: {
      nodeId: string;
      observableId?: string;
      text: string;
      ageDays: number;
    }[];
  }) => Promise<void>;
  readQueue: (params: { which: 'first' | 'second' }) => Promise<unknown>;
  rawQueue: (params: { which: 'first' | 'second' }) => Promise<unknown>;
  seededRawQueue: (params: { which: 'first' | 'second' }) => unknown;
  hasQueueKey: (params: { which: 'first' | 'second' }) => Promise<boolean>;
  queueBar: () => Locator;
  queueCount: () => Locator;
  nodeCard: (params: { which: 'first' | 'second' }) => Locator;
  assertionCard: () => Locator;
  openCommentPopoverOn: (params: { card: Locator }) => Promise<void>;
  closeCommentPopoverOn: (params: { card: Locator }) => Promise<void>;
  queueCommentOn: (params: { card: Locator; text: string }) => Promise<void>;
  popoverQueuedText: () => Locator;
  popoverEditor: () => Locator;
} => {
  // seedTwoQuests learns both quest ids and the guild slug at runtime, and writeQueue parks the
  // exact bytes it wrote so a later assertion can prove another quest's key is byte-identical.
  const seeded = {
    urlSlug: '',
    first: { questId: '', seedRaw: '' },
    second: { questId: '', seedRaw: '' },
  };

  // Internal helpers: return types inferred (a raw string/number annotation is banned in signatures).
  const questFor = ({ which }: { which: 'first' | 'second' }) =>
    which === 'first' ? seeded.first : seeded.second;

  const storageKey = ({ which }: { which: 'first' | 'second' }) =>
    `${QUEUE_KEY_PREFIX}${questFor({ which }).questId}`;

  const readRawQueue = async ({ which }: { which: 'first' | 'second' }) =>
    page.evaluate(READ_KEY_BROWSER_FN, storageKey({ which }));

  const parseQueue = (raw: string | null): QueueEntryRecord[] => {
    if (raw === null || raw === '') {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`comment queue key held a non-array value: ${raw}`);
    }
    return Array.from(parsed) as QueueEntryRecord[];
  };

  const nodeCard = ({ which }: { which: 'first' | 'second' }): Locator =>
    page.getByTestId('FLOW_NODE').filter({
      has: page.getByText(
        which === 'first' ? LIFECYCLE_FIRST_NODE_LABEL : LIFECYCLE_SECOND_NODE_LABEL,
      ),
    });

  const assertionCard = (): Locator =>
    page
      .getByTestId('FLOW_OBSERVABLE_NODE')
      .filter({ has: page.getByText(LIFECYCLE_OBSERVABLE_TEXT) });

  const openCommentPopoverOn = async ({ card }: { card: Locator }): Promise<void> => {
    await card.getByTestId('COMMENT_BUTTON').click();
    await page.getByTestId('COMMENT_POPOVER').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
  };

  // The comment button toggles: a second press on an open popover closes it. Closing one popover
  // before opening the next is how a reviewer moves between boxes, and it keeps the single
  // COMMENT_POPOVER locator unambiguous.
  const closeCommentPopoverOn = async ({ card }: { card: Locator }): Promise<void> => {
    await card.getByTestId('COMMENT_BUTTON').click();
    await page
      .getByTestId('COMMENT_POPOVER')
      .waitFor({ state: 'detached', timeout: PANEL_TIMEOUT });
  };

  // Waits until ELK has laid out and React Flow has mounted every card kind, so a queue or badge
  // assertion never races a half-painted canvas. The mount-time sweep lives in an ancestor effect of
  // this canvas, so a painted canvas also means the purge has already run.
  const waitForSpecPanel = async (): Promise<void> => {
    await page
      .getByTestId('QUEST_SPEC_PANEL')
      .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await page.getByTestId('FLOW_DIAGRAM').waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    await page
      .getByTestId('REACT_FLOW_CANVAS')
      .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    await page
      .getByTestId('FLOW_NODE')
      .nth(FLOW_NODE_COUNT - 1)
      .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    await page
      .getByTestId('FLOW_OBSERVABLE_NODE')
      .nth(OBSERVABLE_NODE_COUNT - 1)
      .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
  };

  return {
    // Both quests land on review_flows with a resumable chaoswhisperer session, so the compose
    // affordance and the queue bar are UNGATED on both. That matters for every absence assertion
    // below: a missing COMMENT_QUEUE_BAR then means "this quest's queue is empty" rather than "the
    // status or session gate closed it".
    seedTwoQuests: async ({ guildName }: { guildName: string }): Promise<void> => {
      const quests = questHarness({ request });
      const guild = await guildHarness({ request }).createGuild({
        name: guildName,
        path: guildPath,
      });
      const guildId = String(guild.id);
      seeded.urlSlug = String(guild.urlSlug ?? guild.name)
        .toLowerCase()
        .replace(/\s+/gu, '-');

      const sessionId = `e2e-session-comment-lifecycle-${Date.now()}`;
      sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

      // Sequential by construction: each quest awaits the previous one's chain link, so both POSTs
      // land in authoring order and `first` is always the earlier-created quest.
      await ['first', 'second'].reduce(async (previous, which) => {
        await previous;
        const created = await quests.createQuest({
          guildId,
          title: `E2E Comment Lifecycle Quest (${which})`,
          userRequest: 'Build the feature',
        });
        const target = which === 'first' ? seeded.first : seeded.second;
        target.questId = String(created.questId);
        quests.writeQuestFile({
          questId: target.questId,
          questFolder: String(created.questFolder),
          questFilePath: String(created.filePath),
          status: 'review_flows',
          workItems: [
            { id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', sessionId },
          ],
          flows: [LIFECYCLE_FLOW],
        });
      }, Promise.resolve());
    },

    openQuest: async ({ which }: { which: 'first' | 'second' }): Promise<void> => {
      await navigationHarness({ page }).navigateToQuest({
        urlSlug: seeded.urlSlug,
        questId: questFor({ which }).questId,
      });
      await waitForSpecPanel();
    },

    // A real full page reload — the browser drops every React tree and every in-memory queue, so
    // whatever the UI shows afterwards came back out of localStorage and nowhere else. This is the
    // gesture that has no jsdom equivalent.
    reloadQuest: async (): Promise<void> => {
      await page.reload();
      await waitForSpecPanel();
    },

    // Writes one quest's queue key directly, with each entry's createdAt minted from its ageDays so
    // the seed can straddle the purge window. Requires a page already open on the app origin
    // (localStorage is origin-scoped) — call openQuest first, then reloadQuest to make the mount
    // read what was written. Deliberately NOT page.addInitScript: an init script re-runs on every
    // subsequent navigation and would silently re-seed the key the purge just emptied.
    writeQueue: async ({
      which,
      entries,
    }: {
      which: 'first' | 'second';
      entries: {
        nodeId: string;
        observableId?: string;
        text: string;
        ageDays: number;
      }[];
    }): Promise<void> => {
      const nowMs = Date.now();
      const value = JSON.stringify(
        entries.map((entry) => ({
          flowId: LIFECYCLE_FLOW_ID,
          nodeId: entry.nodeId,
          ...(entry.observableId === undefined ? {} : { observableId: entry.observableId }),
          text: entry.text,
          createdAt: new Date(nowMs - entry.ageDays * MS_PER_DAY).toISOString(),
        })),
      );
      questFor({ which }).seedRaw = value;
      await page.evaluate(WRITE_KEY_BROWSER_FN, { key: storageKey({ which }), value });
    },

    // The queue exactly as the browser stored it, with each createdAt swapped for the side of the
    // purge window it falls on, so the scenario can assert every field of every entry at once.
    readQueue: async ({ which }: { which: 'first' | 'second' }): Promise<unknown> => {
      const cutoffMs = Date.now() - EXPIRY_DAYS * MS_PER_DAY;
      return parseQueue(await readRawQueue({ which })).map((entry) => {
        const { createdAt } = entry;
        const parsedMs = typeof createdAt === 'string' ? Date.parse(createdAt) : Number.NaN;
        return {
          ...entry,
          createdAt: parsedMs >= cutoffMs ? LIFECYCLE_WITHIN_WINDOW : LIFECYCLE_PAST_WINDOW,
        };
      });
    },

    rawQueue: async ({ which }: { which: 'first' | 'second' }): Promise<unknown> =>
      readRawQueue({ which }),

    // The exact bytes writeQueue put in that quest's key, so an "untouched" assertion compares the
    // whole stored array byte-for-byte rather than merely counting what survived. Synchronous: this
    // reads what the harness itself wrote, never the browser.
    seededRawQueue: ({ which }: { which: 'first' | 'second' }): unknown =>
      questFor({ which }).seedRaw,

    hasQueueKey: async ({ which }: { which: 'first' | 'second' }): Promise<boolean> =>
      (await readRawQueue({ which })) !== null,

    queueBar: (): Locator => page.getByTestId('COMMENT_QUEUE_BAR'),
    queueCount: (): Locator => page.getByTestId('COMMENT_QUEUE_COUNT'),

    nodeCard,
    assertionCard,
    openCommentPopoverOn,
    closeCommentPopoverOn,

    // Queues a comment through the real popover — open, type, Enter — then closes the popover. The
    // reload assertions need a queue the UI itself wrote, so the round trip proves the stored shape
    // and the restored shape are the same shape.
    queueCommentOn: async ({ card, text }: { card: Locator; text: string }): Promise<void> => {
      await openCommentPopoverOn({ card });
      await page.getByTestId('COMMENT_TEXTAREA').click();
      await page.keyboard.type(text);
      await page.getByTestId('COMMENT_TEXTAREA').press('Enter');
      // Enter swaps the editor for the queued read-back view — waiting on it is what proves the
      // queue write landed before the next gesture starts.
      await page
        .getByTestId('COMMENT_QUEUED_TEXT')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
      await closeCommentPopoverOn({ card });
    },

    popoverQueuedText: (): Locator => page.getByTestId('COMMENT_QUEUED_TEXT'),
    popoverEditor: (): Locator => page.getByTestId('COMMENT_TEXTAREA'),
  };
};
