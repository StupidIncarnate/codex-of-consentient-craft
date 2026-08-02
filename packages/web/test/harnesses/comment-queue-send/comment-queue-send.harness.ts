/**
 * PURPOSE: Seeds ONE review_flows quest whose flow diagram carries three commentable action
 * nodes (one bearing an assertion card) plus enough body text to overflow the spec panel, opens
 * it, and exposes the real gestures (queue via popover, Clear, Send), the localStorage reads, and
 * the failure-injection levers the send-queued-comment-batch e2e walks: a genuinely stale anchor
 * (rewriting the on-disk flow to drop a node), a genuine 500 (writing a quest.json questContract
 * rejects, mirroring `writeUnparseableQuestFile`'s own use elsewhere), and a genuine network
 * failure (`browserContext.setOffline`, never `page.route` — intercepting server responses is
 * lint-banned in `.e2e.ts` files). Real React Flow mounting, real localStorage and real network
 * failure injection only exist in a browser, so the mechanics live here and the scenario file
 * asserts what they return.
 *
 * USAGE:
 * const send = commentQueueSendHarness({ page, request, guildPath, sessions, claudeMock });
 * await send.seedAndOpen({ guildName: 'Send Guild' });
 * await send.queueCommentOn({ card: send.nodeCard({ which: 'alpha' }), text: 'note' });
 * await send.clickSendButton();
 */
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import { navigationHarness } from '../navigation/navigation.harness';
import { guildHarness } from '../guild/guild.harness';
import { questHarness } from '../quest/quest.harness';
import type { sessionHarness } from '../session/session.harness';
import type { claudeMockHarness } from '../claude-mock/claude-mock.harness';
import { SimpleTextResponseStub } from '../claude-mock/claude-mock.harness';

const PANEL_TIMEOUT = 5_000;
const CANVAS_TIMEOUT = 10_000;

// The localStorage key prefix from commentQueueStatics. Harness files cannot import statics
// values, so the literal is duplicated here; commentQueueStatics.storage.keyPrefix is its source
// of truth and every queue assertion in the scenario fails loudly if the two ever drift.
const QUEUE_KEY_PREFIX = 'dungeonmaster-quest-comments-';
// The API route template from webConfigStatics — duplicated for the same reason.
const COMMENTS_ROUTE_TEMPLATE = '/api/quests/:questId/comments';

// Ids, labels and text the scenario file selects and asserts on.
export const SEND_FLOW_ID = 'comment-send-flow';
export const SEND_NODE_ALPHA_ID = 'send-node-alpha';
export const SEND_NODE_ALPHA_LABEL = 'Send Node Alpha';
export const SEND_NODE_BETA_ID = 'send-node-beta';
export const SEND_NODE_BETA_LABEL = 'Send Node Beta';
export const SEND_NODE_GAMMA_ID = 'send-node-gamma';
export const SEND_NODE_GAMMA_LABEL = 'Send Node Gamma';
export const SEND_OBSERVABLE_ID = 'send-observable-alpha';
export const SEND_OBSERVABLE_TEXT = 'the alpha node paints its own diagram canvas';

// A long, repeated userRequest is the only content field this harness can seed (writeQuestFile
// hardcodes designDecisions to []), so it is what forces the spec panel's content to overflow its
// fixed-height flex box and become scrollable — the precondition #check-bar-stays-visible-when-
// scrolled needs.
const OVERFLOW_PARAGRAPH =
  'This paragraph exists only to push the spec panel content past the viewport so the panel becomes scrollable. ';
const OVERFLOW_REPEAT_COUNT = 80;
const LONG_USER_REQUEST = OVERFLOW_PARAGRAPH.repeat(OVERFLOW_REPEAT_COUNT);

type FlowNodeInput = Record<PropertyKey, unknown>;

// Return type inferred (Record<PropertyKey, unknown>, matching questHarness's own FlowInput
// shape) — an explicit primitive-bearing annotation here is what the lint bans, not the data.
const buildFlow = ({ includeBeta }: { includeBeta: boolean }) => {
  const nodes: FlowNodeInput[] = [
    {
      id: SEND_NODE_ALPHA_ID,
      label: SEND_NODE_ALPHA_LABEL,
      type: 'action',
      observables: [
        { id: SEND_OBSERVABLE_ID, type: 'ui-state', description: SEND_OBSERVABLE_TEXT },
      ],
    },
    ...(includeBeta
      ? [{ id: SEND_NODE_BETA_ID, label: SEND_NODE_BETA_LABEL, type: 'action', observables: [] }]
      : []),
    { id: SEND_NODE_GAMMA_ID, label: SEND_NODE_GAMMA_LABEL, type: 'action', observables: [] },
    { id: 'send-terminal', label: 'Send Terminal', type: 'terminal', observables: [] },
  ];
  const chain = includeBeta
    ? [SEND_NODE_ALPHA_ID, SEND_NODE_BETA_ID, SEND_NODE_GAMMA_ID, 'send-terminal']
    : [SEND_NODE_ALPHA_ID, SEND_NODE_GAMMA_ID, 'send-terminal'];
  const edges = chain.slice(0, -1).map((from, index) => ({
    id: `${from}-to-${chain[index + 1]}`,
    from,
    to: chain[index + 1],
  }));

  return {
    id: SEND_FLOW_ID,
    name: 'Comment Send Flow',
    flowType: 'runtime',
    entryPoint: SEND_NODE_ALPHA_ID,
    exitPoints: ['send-terminal'],
    nodes,
    edges,
  };
};

const FULL_NODE_COUNT = 4; // alpha, beta, gamma, terminal
const FULL_OBSERVABLE_COUNT = 1;

type QueueEntryRecord = Record<PropertyKey, unknown>;

// Browser-evaluated: reads one localStorage key. Return type inferred so the signature carries no
// raw-primitive annotation.
const READ_KEY_BROWSER_FN = (key: string) => globalThis.localStorage.getItem(key);

export const commentQueueSendHarness = ({
  page,
  request,
  guildPath,
  sessions,
  claudeMock,
}: {
  page: Page;
  request: APIRequestContext;
  guildPath: string;
  sessions: ReturnType<typeof sessionHarness>;
  claudeMock: ReturnType<typeof claudeMockHarness>;
}): {
  seedAndOpen: (params: { guildName: string }) => Promise<void>;
  nodeCard: (params: { which: 'alpha' | 'beta' | 'gamma' }) => Locator;
  observableCard: () => Locator;
  specPanelContent: () => Locator;
  actionBar: () => Locator;
  queueBar: () => Locator;
  queueCount: () => Locator;
  clearButton: () => Locator;
  sendButton: () => Locator;
  openCommentPopoverOn: (params: { card: Locator }) => Promise<void>;
  closeCommentPopoverOn: (params: { card: Locator }) => Promise<void>;
  queueCommentOn: (params: { card: Locator; text: string }) => Promise<void>;
  clickClearButton: () => Promise<void>;
  clickSendButton: () => Promise<void>;
  scrollSpecPanelContentToBottom: () => Promise<void>;
  readQueue: () => Promise<QueueEntryRecord[]>;
  hasQueueKey: () => Promise<boolean>;
  waitForCommentsPostRequest: () => Promise<unknown>;
  hasCommentPostRequest: () => boolean;
  makeNodeBetaStale: () => void;
  corruptQuestFile: () => void;
  restoreQuestFile: () => void;
  goOffline: () => Promise<void>;
  goOnline: () => Promise<void>;
  queueClaudeResponse: (params: { text: string }) => void;
} => {
  const seeded = { questId: '', questFolder: '', questFilePath: '', urlSlug: '', sessionId: '' };
  // Every POST to the comments route the page has fired, oldest first. Clear is synchronous — its
  // click handler never calls fetch at all — so reading this list right after a Clear click
  // already reflects reality with no race to wait out.
  const commentPostLog: unknown[] = [];

  // Internal helpers: return types inferred (a raw string/number annotation is banned in
  // signatures — see comment-box.harness.ts for the same convention).
  const storageKey = () => `${QUEUE_KEY_PREFIX}${seeded.questId}`;
  const commentsUrlSuffix = () => COMMENTS_ROUTE_TEMPLATE.replace(':questId', seeded.questId);
  const readRawQueue = async () => page.evaluate(READ_KEY_BROWSER_FN, storageKey());

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

  const nodeLabelFor = ({ which }: { which: 'alpha' | 'beta' | 'gamma' }) => {
    if (which === 'alpha') {
      return SEND_NODE_ALPHA_LABEL;
    }
    if (which === 'beta') {
      return SEND_NODE_BETA_LABEL;
    }
    return SEND_NODE_GAMMA_LABEL;
  };

  const nodeCard = ({ which }: { which: 'alpha' | 'beta' | 'gamma' }): Locator =>
    page.getByTestId('FLOW_NODE').filter({ has: page.getByText(nodeLabelFor({ which })) });

  const observableCard = (): Locator =>
    page.getByTestId('FLOW_OBSERVABLE_NODE').filter({ has: page.getByText(SEND_OBSERVABLE_TEXT) });

  const openCommentPopoverOn = async ({ card }: { card: Locator }): Promise<void> => {
    await card.getByTestId('COMMENT_BUTTON').click();
    await page.getByTestId('COMMENT_POPOVER').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
  };

  const closeCommentPopoverOn = async ({ card }: { card: Locator }): Promise<void> => {
    await card.getByTestId('COMMENT_BUTTON').click();
    await page
      .getByTestId('COMMENT_POPOVER')
      .waitFor({ state: 'detached', timeout: PANEL_TIMEOUT });
  };

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
      .nth(FULL_NODE_COUNT - 1)
      .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    await page
      .getByTestId('FLOW_OBSERVABLE_NODE')
      .nth(FULL_OBSERVABLE_COUNT - 1)
      .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
  };

  const seedWorkItems = () => [
    {
      id: 'e2e00000-0000-4000-8000-000000000001',
      role: 'chaoswhisperer',
      sessionId: seeded.sessionId,
    },
  ];

  return {
    seedAndOpen: async ({ guildName }: { guildName: string }): Promise<void> => {
      const quests = questHarness({ request });
      const guild = await guildHarness({ request }).createGuild({
        name: guildName,
        path: guildPath,
      });
      const guildId = String(guild.id);
      seeded.urlSlug = String(guild.urlSlug ?? guild.name)
        .toLowerCase()
        .replace(/\s+/gu, '-');

      seeded.sessionId = `e2e-session-comment-send-${Date.now()}`;
      sessions.createSessionFile({ sessionId: seeded.sessionId, userMessage: 'Build the feature' });

      const created = await quests.createQuest({
        guildId,
        title: 'E2E Comment Send Quest',
        userRequest: LONG_USER_REQUEST,
      });
      // Single atomic assignment rather than three sequential `seeded.x = ...` statements — ESLint's
      // require-atomic-updates otherwise flags each as a possible race against `seeded` being read
      // mid-await elsewhere.
      Object.assign(seeded, {
        questId: String(created.questId),
        questFolder: String(created.questFolder),
        questFilePath: String(created.filePath),
      });

      quests.writeQuestFile({
        questId: seeded.questId,
        questFolder: seeded.questFolder,
        questFilePath: seeded.questFilePath,
        status: 'review_flows',
        userRequest: LONG_USER_REQUEST,
        workItems: seedWorkItems(),
        flows: [buildFlow({ includeBeta: true })],
      });

      page.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes(commentsUrlSuffix())) {
          commentPostLog.push(req.postDataJSON());
        }
      });

      await navigationHarness({ page }).navigateToQuest({
        urlSlug: seeded.urlSlug,
        questId: seeded.questId,
      });
      await waitForSpecPanel();
    },

    nodeCard,
    observableCard,

    specPanelContent: (): Locator => page.getByTestId('QUEST_SPEC_PANEL_CONTENT'),
    actionBar: (): Locator => page.getByTestId('ACTION_BAR'),
    queueBar: (): Locator => page.getByTestId('COMMENT_QUEUE_BAR'),
    queueCount: (): Locator => page.getByTestId('COMMENT_QUEUE_COUNT'),
    clearButton: (): Locator => page.getByTestId('COMMENT_CLEAR_BUTTON'),
    sendButton: (): Locator => page.getByTestId('COMMENT_SEND_BUTTON'),

    openCommentPopoverOn,
    closeCommentPopoverOn,

    // Queues via the Enter key — open, type, Enter, wait for the queued readback, close.
    queueCommentOn: async ({ card, text }: { card: Locator; text: string }): Promise<void> => {
      await openCommentPopoverOn({ card });
      await page.getByTestId('COMMENT_TEXTAREA').click();
      await page.keyboard.type(text);
      await page.getByTestId('COMMENT_TEXTAREA').press('Enter');
      await page
        .getByTestId('COMMENT_QUEUED_TEXT')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
      await closeCommentPopoverOn({ card });
    },

    clickClearButton: async (): Promise<void> => {
      await page.getByTestId('COMMENT_CLEAR_BUTTON').click();
    },

    clickSendButton: async (): Promise<void> => {
      await page.getByTestId('COMMENT_SEND_BUTTON').click();
    },

    scrollSpecPanelContentToBottom: async (): Promise<void> => {
      await page.getByTestId('QUEST_SPEC_PANEL_CONTENT').evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
    },

    readQueue: async (): Promise<QueueEntryRecord[]> => parseQueue(await readRawQueue()),

    hasQueueKey: async (): Promise<boolean> => (await readRawQueue()) !== null,

    waitForCommentsPostRequest: async (): Promise<unknown> => {
      const req = await page.waitForRequest(
        (r) => r.method() === 'POST' && r.url().includes(commentsUrlSuffix()),
      );
      return req.postDataJSON();
    },

    hasCommentPostRequest: (): boolean => commentPostLog.length > 0,

    // Rewrites the on-disk flow with node beta dropped — the real server genuinely cannot
    // resolve a comment anchored to beta afterward, so a Send against it earns a REAL 409
    // naming beta, never a stubbed one. Every other seed field is left exactly as originally
    // written (same status, same session, same userRequest).
    makeNodeBetaStale: (): void => {
      questHarness({ request }).writeQuestFile({
        questId: seeded.questId,
        questFolder: seeded.questFolder,
        questFilePath: seeded.questFilePath,
        status: 'review_flows',
        userRequest: LONG_USER_REQUEST,
        workItems: seedWorkItems(),
        flows: [buildFlow({ includeBeta: false })],
      });
    },

    // Overwrites quest.json with a shape questContract rejects (mirrors
    // questHarness.writeUnparseableQuestFile's own use in unreadable-quest-file-reported.e2e.ts).
    // The comments responder's quest-load call throws for real, and its outer try/catch is the
    // ONLY thing that can turn that into a 500 — a genuine one, not a stubbed response.
    corruptQuestFile: (): void => {
      questHarness({ request }).writeUnparseableQuestFile({
        questId: seeded.questId,
        questFolder: seeded.questFolder,
        questFilePath: seeded.questFilePath,
      });
    },

    // Restores quest.json to the exact shape it held before corruptQuestFile — same status,
    // session and flow — so the very next Send resolves against a loadable quest again.
    restoreQuestFile: (): void => {
      questHarness({ request }).writeQuestFile({
        questId: seeded.questId,
        questFolder: seeded.questFolder,
        questFilePath: seeded.questFilePath,
        status: 'review_flows',
        userRequest: LONG_USER_REQUEST,
        workItems: seedWorkItems(),
        flows: [buildFlow({ includeBeta: true })],
      });
    },

    // A true network outage, not a faked response: setOffline blocks the browser from opening
    // ANY new connection, so the real fetch() call rejects before a byte of response arrives —
    // the exact shape #check-network-failure-retains-queue and #check-network-failure-notifies
    // both name. `page.route()` is banned in `.e2e.ts` files (rule-ban-page-route-in-e2e) because
    // faking a response bypasses the real server; setOffline fakes nothing, it just cuts the wire.
    goOffline: async (): Promise<void> => {
      await page.context().setOffline(true);
    },

    goOnline: async (): Promise<void> => {
      await page.context().setOffline(false);
    },

    // Queues one fake-CLI response keyed to THIS harness's own seeded session, mirroring
    // chat-send-auto-resumes.e2e.ts — a real Send resumes this exact session via
    // ChatStartResponder, so the response must carry the same sessionId the fake CLI is asked to
    // resume.
    queueClaudeResponse: ({ text }: { text: string }): void => {
      claudeMock.queueResponse({
        response: SimpleTextResponseStub({ sessionId: seeded.sessionId, text }),
      });
    },
  };
};
