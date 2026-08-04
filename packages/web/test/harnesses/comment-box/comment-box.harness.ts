/**
 * PURPOSE: Seeds a quest whose flow diagram carries node cards, an assertion card and a cross-flow
 * portal card, opens it in the QUEST SPEC panel, and exposes the pointer gestures and localStorage
 * reads the leave-a-comment-on-a-diagram-box e2e walks. Real React Flow mounting, real pointer
 * events and real localStorage only exist in a browser, so the mechanics live here and the scenario
 * file asserts what they return.
 *
 * USAGE:
 * const comments = commentBoxHarness({ page, request, guildPath, sessions });
 * await comments.seedAndOpen({ guildName: 'Comment Guild', status: 'review_flows', withSession: true });
 * await comments.openCommentPopoverOnNode();
 * expect(await comments.readQueue()).toStrictEqual([...]);
 */
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import { commentTextContract } from '@dungeonmaster/shared/contracts';
import type { CommentText } from '@dungeonmaster/shared/contracts';

import { navigationHarness } from '../navigation/navigation.harness';
import { guildHarness } from '../guild/guild.harness';
import { questHarness } from '../quest/quest.harness';
import type { sessionHarness } from '../session/session.harness';

const PANEL_TIMEOUT = 5_000;
const CANVAS_TIMEOUT = 10_000;
// A pointer wobble big enough to cross React Flow's 1px node-drag threshold yet small enough to stay
// inside the icon button, so mouseup lands back on the button and the gesture still registers as a
// click. Without the nodrag/nopan opt-out this same wobble drags the card out from under the cursor.
const BUTTON_WOBBLE_PX = 6;
const WOBBLE_STEPS = 4;
// Card positions are compared in viewport pixels, so anything under a pixel is subpixel rounding.
const POSITION_EPSILON_PX = 1;
const HALF_DIVISOR = 2;

// The localStorage key prefix from commentQueueStatics. Harness files cannot import statics values,
// so the literal is duplicated here; commentQueueStatics.storage.keyPrefix is its source of truth
// and every queue assertion in the scenario fails loudly if the two ever drift.
const QUEUE_KEY_PREFIX = 'dungeonmaster-quest-comments-';

// Ids, labels and text the scenario file selects and asserts on. Exported so the scenario references
// the seeded flow rather than inlining strings that could drift away from it.
export const COMMENT_BOX_NODE_LABEL = 'Review Spec';
export const COMMENT_BOX_OBSERVABLE_TEXT = 'the spec panel renders the flow diagram canvas';
export const COMMENT_BOX_FLOW_ID = 'comment-review-flow';
export const COMMENT_BOX_NODE_ID = 'review-spec';
export const COMMENT_BOX_OBSERVABLE_ID = 'diagram-canvas-renders';
// A queued comment's createdAt is minted at click time and can never be predicted, so readQueue
// swaps a value that round-trips as a real ISO timestamp for this sentinel. The scenario then
// asserts the whole entry with toStrictEqual AND gets the "createdAt is a real ISO timestamp" check
// for free — a raw passthrough would force a weaker per-field assertion.
export const COMMENT_BOX_ISO_CREATED_AT = '<iso-timestamp>';
// A review note that is ONE unbroken token — the shape a comment takes when it names a symbol. The
// popover dropdown is a fixed width, and pre-wrap never splits a token with no break opportunity, so
// without overflow-wrap this row paints past the dropdown and the rest of the note is clipped. Long
// enough that no monospace face could fit the token in the dropdown's content box, so the geometry
// assertion does not depend on which font the test machine resolves `monospace` to. A
// slash-separated path would NOT reproduce it: UAX#14 permits a break after a solidus.
export const COMMENT_BOX_LONG_TOKEN_TEXT =
  'rename boxCommentsTransformerFiltersByFlowIdAndNodeIdAndObservableIdNewestFirst please';

// A second box on a DIFFERENT node than review-spec's observable, so a test can prove a comment
// queued on one box never bleeds into the other — the "right box, not just the first box" this
// fixture exists to distinguish. Anchored to the terminal node, whose own FLOW_NODE card and this
// assertion card are both usable as a fully independent second target.
export const COMMENT_BOX_SECOND_NODE_ID = 'accept-spec';
export const COMMENT_BOX_SECOND_OBSERVABLE_ID = 'accept-spec-recorded';
export const COMMENT_BOX_SECOND_OBSERVABLE_TEXT = 'the accepted spec state is recorded';

// A newline-bearing note — the shape a comment takes when a reviewer quotes multiple lines back.
// Split on \n and typed through composeMultiLineComment (typeComment cannot carry this: a bare \n
// inside the string types as an unshifted Enter keypress, and the widget's own handler submits the
// draft before the second line ever lands), then queued and read back — proving the character
// survives the JSON.stringify/JSON.parse round trip into localStorage and repaints as a real line
// break rather than collapsing away.
export const COMMENT_BOX_NEWLINE_TEXT = 'first line\nsecond line';

// A note that reads as markup. React renders {queued.text} as a plain text node, never HTML, so
// this proves the queue stores and repaints it inert rather than stripped or interpreted — and
// stands as a regression guard if a future change ever swapped that text node for
// dangerouslySetInnerHTML.
export const COMMENT_BOX_MARKUP_TEXT = '<script>alert(1)</script>';

// A note far longer than any UI element here was sized for — nothing in this feature caps comment
// length, so this proves the popover, the queued view and the localStorage round trip all carry
// bulk text whole rather than truncating or corrupting the stored entry. Built from a repeated
// phrase joined by single spaces (not String.repeat on a trailing-space phrase) so the string
// carries NO leading/trailing whitespace of its own — submitDraft trims the whole draft on submit
// (proven separately in comment-popover-widget.test.tsx), so a trailing space here would be
// legitimately stripped and make this fixture assert the wrong "oversized" value.
export const COMMENT_BOX_OVERSIZED_TEXT = Array.from(
  { length: 150 },
  () => 'This assertion needs another pass.',
).join(' ');

// A note containing the exact characters a hand-rolled (string-concatenation) serializer would
// mangle: double quotes, a backslash, and brace characters that read as nested JSON. The real
// localStorage path uses JSON.stringify/JSON.parse, so this proves the round trip survives
// byte-identical rather than corrupting or truncating at the first quote or backslash.
export const COMMENT_BOX_JSON_HOSTILE_TEXT =
  'She typed "click submit" \\ then pasted {"nodeId": "start", "ok": true} inline';

// Three flow nodes, one assertion card branching off the entry node, and one cross-flow edge whose
// target lives in another flow so the canvas also paints a FLOW_PORTAL_NODE stand-in. That mix is
// exactly what #check-comment-button-on-flow-node / -on-observable-node / -no-...-on-portal need on
// one canvas: every box kind this flow can render, together.
const COMMENT_FLOW = {
  id: COMMENT_BOX_FLOW_ID,
  name: 'Comment Review Flow',
  flowType: 'runtime',
  entryPoint: COMMENT_BOX_NODE_ID,
  exitPoints: ['accept-spec'],
  nodes: [
    {
      id: COMMENT_BOX_NODE_ID,
      label: COMMENT_BOX_NODE_LABEL,
      type: 'action',
      observables: [
        {
          id: COMMENT_BOX_OBSERVABLE_ID,
          type: 'ui-state',
          description: COMMENT_BOX_OBSERVABLE_TEXT,
        },
      ],
    },
    { id: 'looks-right', label: 'Looks Right?', type: 'decision', observables: [] },
    {
      id: COMMENT_BOX_SECOND_NODE_ID,
      label: 'Accept Spec',
      type: 'terminal',
      observables: [
        {
          id: COMMENT_BOX_SECOND_OBSERVABLE_ID,
          type: 'ui-state',
          description: COMMENT_BOX_SECOND_OBSERVABLE_TEXT,
        },
      ],
    },
  ],
  edges: [
    { id: 'review-to-decision', from: COMMENT_BOX_NODE_ID, to: 'looks-right' },
    { id: 'decision-to-accept', from: 'looks-right', to: 'accept-spec', label: 'yes' },
    // Cross-flow hand-off: `flowId:nodeId` resolves to no local node, so the diagram renders a
    // portal stand-in for it — the one box kind that must carry NO comment button.
    { id: 'decision-to-rework', from: 'looks-right', to: 'rework-flow:rework-entry', label: 'no' },
  ],
};

const FLOW_NODE_COUNT = COMMENT_FLOW.nodes.length;
const OBSERVABLE_NODE_COUNT = COMMENT_FLOW.nodes.reduce(
  (sum, node) => sum + node.observables.length,
  0,
);

type QueueEntryRecord = Record<PropertyKey, unknown>;

// Browser-evaluated: reads one localStorage key and hands back its raw contents (or null). Return
// types on these helpers are inferred so the signature carries no raw-primitive annotation.
const READ_KEY_BROWSER_FN = (key: string) => globalThis.localStorage.getItem(key);

// Runs in the browser BEFORE the app boots (page.addInitScript), so the quest route's mount finds a
// queue already in localStorage — the only way to reach a state whose own compose affordance is
// hidden, which is exactly what #check-no-queue-bar-without-session asks for.
const SEED_KEY_BROWSER_FN = ({ key, value }: { key: string; value: string }): void => {
  globalThis.localStorage.setItem(key, value);
};

// Browser-evaluated predicate: the queued-comment row must paint no wider than the popover holding
// it. An unbroken token that cannot wrap overflows its own content box (scrollWidth exceeds
// clientWidth) AND paints past the dropdown's right edge. jsdom reports every width as 0, so a
// widget test can assert the break-word declaration but never that the row actually fits — only a
// browser can. Returns a boolean so the harness signature exposes no raw number. One pixel of slack
// absorbs sub-pixel rounding on the right edge; a real overflow is hundreds of pixels.
const QUEUED_TEXT_FITS_BROWSER_FN = (el: Element): boolean => {
  const dropdown = el.closest('[data-testid="COMMENT_POPOVER"]');
  if (dropdown === null) {
    return false;
  }
  return (
    el.scrollWidth <= el.clientWidth &&
    el.getBoundingClientRect().right <= dropdown.getBoundingClientRect().right + 1
  );
};

export const commentBoxHarness = ({
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
  seedAndOpen: (params: {
    guildName: string;
    status: string;
    withSession: boolean;
    preQueuedText?: string;
  }) => Promise<void>;
  nodeCard: () => Locator;
  observableCard: () => Locator;
  secondObservableCard: () => Locator;
  everyFlowNodeHasOneCommentButton: () => Promise<boolean>;
  everyObservableNodeHasOneCommentButton: () => Promise<boolean>;
  portalCardHasNoCommentButton: () => Promise<boolean>;
  openCommentPopoverOnNode: () => Promise<void>;
  openCommentPopoverOnObservable: () => Promise<void>;
  openCommentPopoverOnSecondObservable: () => Promise<void>;
  closeCommentPopoverOnNode: () => Promise<void>;
  closeCommentPopoverOnSecondObservable: () => Promise<void>;
  clickNodeCardBody: () => Promise<void>;
  commentButtonWobbleLeavesCardInPlace: () => Promise<boolean>;
  typeComment: (params: { text: string }) => Promise<void>;
  composeMultiLineComment: (params: { lines: string[] }) => Promise<void>;
  replaceComment: (params: { text: string }) => Promise<void>;
  pressEnter: () => Promise<void>;
  captureTextareaHeight: () => Promise<void>;
  textareaGrewSinceCapture: () => Promise<boolean>;
  clickQueueButton: () => Promise<void>;
  clickCancelButton: () => Promise<void>;
  clickEditButton: () => Promise<void>;
  clickDeleteButton: () => Promise<void>;
  queuedTextFitsInsidePopover: () => Promise<boolean>;
  queuedTextExact: () => Promise<CommentText>;
  readQueue: () => Promise<unknown>;
  hasQueueKey: () => Promise<boolean>;
  captureQueueSnapshot: () => Promise<void>;
  queueUnchangedSinceCapture: () => Promise<boolean>;
  queueCreatedAtBumpedSinceCapture: () => Promise<boolean>;
} => {
  // Mutable holders: seedAndOpen learns the questId (and therefore the storage key) at runtime, and
  // the capture/compare helpers need somewhere to park a "before" value between two awaits.
  const seeded = { questId: '' };
  const captured = { queueRaw: '', textareaHeightPx: 0 };

  // Internal helpers: return types inferred (a raw string/number annotation is banned in signatures).
  const storageKey = () => `${QUEUE_KEY_PREFIX}${seeded.questId}`;

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

  const firstCreatedAtMs = (raw: string | null) => {
    const [entry] = parseQueue(raw);
    if (entry === undefined) {
      throw new Error('comment queue is empty — no createdAt to compare');
    }
    const { createdAt } = entry;
    if (typeof createdAt !== 'string') {
      throw new Error(`comment queue entry has no string createdAt: ${JSON.stringify(entry)}`);
    }
    return Date.parse(createdAt);
  };

  const textarea = (): Locator => page.getByTestId('COMMENT_TEXTAREA');

  const nodeCard = (): Locator =>
    page.getByTestId('FLOW_NODE').filter({ has: page.getByText(COMMENT_BOX_NODE_LABEL) });

  const observableCard = (): Locator =>
    page
      .getByTestId('FLOW_OBSERVABLE_NODE')
      .filter({ has: page.getByText(COMMENT_BOX_OBSERVABLE_TEXT) });

  const secondObservableCard = (): Locator =>
    page
      .getByTestId('FLOW_OBSERVABLE_NODE')
      .filter({ has: page.getByText(COMMENT_BOX_SECOND_OBSERVABLE_TEXT) });

  // Counts the COMMENT_BUTTON descendants of every card carrying the given testid, so a card that
  // renders two buttons — or none — is as much a failure as a wrong total across the canvas.
  const commentButtonsPerCard = async ({ testId }: { testId: string }) => {
    const cards = page.getByTestId(testId);
    const count = await cards.count();
    return Promise.all(
      Array.from({ length: count }, async (_unused, index) =>
        cards.nth(index).getByTestId('COMMENT_BUTTON').count(),
      ),
    );
  };

  const textareaHeight = async () => {
    const box = await textarea().boundingBox();
    if (box === null) {
      throw new Error('COMMENT_TEXTAREA has no bounding box');
    }
    return box.height;
  };

  const openPopoverOn = async ({ card }: { card: Locator }): Promise<void> => {
    await card.getByTestId('COMMENT_BUTTON').click();
    await page.getByTestId('COMMENT_POPOVER').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
  };

  // The comment button toggles: a second press on an open popover closes it. Shared by every
  // "close this box's popover" method so two boxes never have their popovers open at once, which
  // would leave testid locators like COMMENT_TEXTAREA ambiguous across both.
  const closePopoverOn = async ({ card }: { card: Locator }): Promise<void> => {
    await card.getByTestId('COMMENT_BUTTON').click();
    await page
      .getByTestId('COMMENT_POPOVER')
      .waitFor({ state: 'detached', timeout: PANEL_TIMEOUT });
  };

  return {
    seedAndOpen: async ({
      guildName,
      status,
      withSession,
      preQueuedText,
    }: {
      guildName: string;
      status: string;
      withSession: boolean;
      preQueuedText?: string;
    }): Promise<void> => {
      const quests = questHarness({ request });
      const nav = navigationHarness({ page });
      const guild = await guildHarness({ request }).createGuild({
        name: guildName,
        path: guildPath,
      });
      const guildId = String(guild.id);

      const sessionId = `e2e-session-comment-${Date.now()}`;
      sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

      const created = await quests.createQuest({
        guildId,
        title: 'E2E Comment Box Quest',
        userRequest: 'Build the feature',
      });
      seeded.questId = String(created.questId);

      // withSession false drops the sessionId from the chaoswhisperer work item, which is the exact
      // shape hasResumableChatSessionGuard rejects — the role stays, so the ONLY difference between
      // the two seeds is the sessionId itself.
      quests.writeQuestFile({
        questId: seeded.questId,
        questFolder: String(created.questFolder),
        questFilePath: String(created.filePath),
        status,
        workItems: [
          {
            id: 'e2e00000-0000-4000-8000-000000000001',
            role: 'chaoswhisperer',
            ...(withSession ? { sessionId } : {}),
          },
        ],
        flows: [COMMENT_FLOW],
      });

      if (preQueuedText !== undefined) {
        await page.addInitScript(SEED_KEY_BROWSER_FN, {
          key: storageKey(),
          value: JSON.stringify([
            {
              flowId: COMMENT_BOX_FLOW_ID,
              nodeId: COMMENT_BOX_NODE_ID,
              text: preQueuedText,
              createdAt: new Date().toISOString(),
            },
          ]),
        });
      }

      const urlSlug = String(guild.urlSlug ?? guild.name)
        .toLowerCase()
        .replace(/\s+/gu, '-');
      await nav.navigateToQuest({ urlSlug, questId: seeded.questId });

      await page
        .getByTestId('QUEST_SPEC_PANEL')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

      // An approved quest surfaces the Begin Quest modal on load and its overlay intercepts every
      // canvas click. A reviewer dismisses it via Keep Chatting to read the spec — do the same. The
      // modal belongs to another flow (quest-approved-modal.e2e owns it), so dismissing precondition
      // state here bypasses no control this flow is testing.
      const keepChatting = page.getByTestId('PIXEL_BTN').filter({ hasText: 'Keep Chatting' });
      if (await keepChatting.isVisible().catch(() => false)) {
        await keepChatting.click();
        await page
          .getByTestId('QUEST_APPROVED_MODAL_TITLE')
          .waitFor({ state: 'hidden', timeout: PANEL_TIMEOUT });
      }

      await page.getByTestId('FLOW_DIAGRAM').waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      await page
        .getByTestId('REACT_FLOW_CANVAS')
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      // Wait until ELK has laid out and React Flow has mounted every card kind, so a count assertion
      // never races a half-painted canvas.
      await page
        .getByTestId('FLOW_NODE')
        .nth(FLOW_NODE_COUNT - 1)
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      await page
        .getByTestId('FLOW_OBSERVABLE_NODE')
        .nth(OBSERVABLE_NODE_COUNT - 1)
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      await page
        .getByTestId('FLOW_PORTAL_NODE')
        .first()
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    },

    nodeCard,
    observableCard,
    secondObservableCard,

    everyFlowNodeHasOneCommentButton: async (): Promise<boolean> => {
      const perCard = await commentButtonsPerCard({ testId: 'FLOW_NODE' });
      return perCard.length === FLOW_NODE_COUNT && perCard.every((count) => count === 1);
    },

    everyObservableNodeHasOneCommentButton: async (): Promise<boolean> => {
      const perCard = await commentButtonsPerCard({ testId: 'FLOW_OBSERVABLE_NODE' });
      return perCard.length === OBSERVABLE_NODE_COUNT && perCard.every((count) => count === 1);
    },

    portalCardHasNoCommentButton: async (): Promise<boolean> => {
      const perCard = await commentButtonsPerCard({ testId: 'FLOW_PORTAL_NODE' });
      return perCard.length > 0 && perCard.every((count) => count === 0);
    },

    openCommentPopoverOnNode: async (): Promise<void> => {
      await openPopoverOn({ card: nodeCard() });
    },

    openCommentPopoverOnObservable: async (): Promise<void> => {
      await openPopoverOn({ card: observableCard() });
    },

    openCommentPopoverOnSecondObservable: async (): Promise<void> => {
      await openPopoverOn({ card: secondObservableCard() });
    },

    // Closing and pressing again is how a reviewer returns to a box they already queued something
    // on, which is the only way to reach the already-has-a-queued-comment branch through the real UI.
    closeCommentPopoverOnNode: async (): Promise<void> => {
      await closePopoverOn({ card: nodeCard() });
    },

    // Needed whenever a test must move on to a DIFFERENT box's popover: only one popover may be
    // open at a time, or the two boxes' shared testids (COMMENT_TEXTAREA, COMMENT_QUEUED_TEXT, ...)
    // become ambiguous locators.
    closeCommentPopoverOnSecondObservable: async (): Promise<void> => {
      await closePopoverOn({ card: secondObservableCard() });
    },

    // Clicks the card's own label, which is the part of the card a reviewer clicks to open the
    // detail panel. The comment button stops propagation; everywhere else on the card must not.
    clickNodeCardBody: async (): Promise<void> => {
      await nodeCard().getByTestId('FLOW_NODE_LABEL').click();
    },

    // Presses the comment button and wobbles the pointer before releasing, still inside the button.
    // React Flow starts a node drag (or a canvas pan) on any pointer movement past its 1px threshold
    // unless the target opts out via nodrag/nopan — so without the opt-out this moves the card.
    commentButtonWobbleLeavesCardInPlace: async (): Promise<boolean> => {
      const before = await nodeCard().boundingBox();
      if (before === null) {
        throw new Error('FLOW_NODE card has no bounding box before the wobble');
      }
      const buttonBox = await nodeCard().getByTestId('COMMENT_BUTTON').boundingBox();
      if (buttonBox === null) {
        throw new Error('COMMENT_BUTTON has no bounding box');
      }
      const originX = buttonBox.x + buttonBox.width / HALF_DIVISOR;
      const originY = buttonBox.y + buttonBox.height / HALF_DIVISOR;

      await page.mouse.move(originX, originY);
      await page.mouse.down();
      await page.mouse.move(originX + BUTTON_WOBBLE_PX, originY + BUTTON_WOBBLE_PX, {
        steps: WOBBLE_STEPS,
      });
      await page.mouse.move(originX, originY, { steps: WOBBLE_STEPS });
      await page.mouse.up();

      await page
        .getByTestId('COMMENT_POPOVER')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

      const after = await nodeCard().boundingBox();
      if (after === null) {
        throw new Error('FLOW_NODE card has no bounding box after the wobble');
      }
      return (
        Math.abs(after.x - before.x) <= POSITION_EPSILON_PX &&
        Math.abs(after.y - before.y) <= POSITION_EPSILON_PX
      );
    },

    // Click first, then drive the keyboard: clicking an empty textarea puts the caret at the end, and
    // page.keyboard types at the live caret rather than re-focusing per call, so the composed value
    // is deterministic across the newline presses composeMultiLineComment interleaves.
    typeComment: async ({ text }: { text: string }): Promise<void> => {
      await textarea().click();
      await page.keyboard.type(text);
    },

    composeMultiLineComment: async ({ lines }: { lines: string[] }): Promise<void> => {
      const [first, ...rest] = lines;
      await textarea().click();
      await page.keyboard.type(first ?? '');
      // Sequential by construction: each line awaits the previous one's chain link, so the newlines
      // and the text they separate reach the textarea in authoring order.
      await rest.reduce(async (previous, line) => {
        await previous;
        // Shift+Enter must fall through to the textarea's own newline handling instead of queueing.
        await page.keyboard.press('Shift+Enter');
        await page.keyboard.type(line);
      }, Promise.resolve());
    },

    // Replaces the whole value rather than appending, so an edit test asserts the edited text it
    // meant to write regardless of where the caret landed when the editor reopened prefilled.
    replaceComment: async ({ text }: { text: string }): Promise<void> => {
      await textarea().fill(text);
    },

    pressEnter: async (): Promise<void> => {
      await textarea().press('Enter');
    },

    captureTextareaHeight: async (): Promise<void> => {
      captured.textareaHeightPx = await textareaHeight();
    },

    textareaGrewSinceCapture: async (): Promise<boolean> =>
      (await textareaHeight()) > captured.textareaHeightPx,

    clickQueueButton: async (): Promise<void> => {
      await page.getByTestId('COMMENT_QUEUE_BUTTON').click();
    },

    clickCancelButton: async (): Promise<void> => {
      await page.getByTestId('COMMENT_CANCEL_BUTTON').click();
    },

    clickEditButton: async (): Promise<void> => {
      await page.getByTestId('COMMENT_EDIT_BUTTON').click();
    },

    clickDeleteButton: async (): Promise<void> => {
      await page.getByTestId('COMMENT_DELETE_BUTTON').click();
    },

    // Whether the queued-comment row actually fits inside the popover it is rendered in — the
    // painted outcome, measured on the real layout rather than inferred from a style rule.
    queuedTextFitsInsidePopover: async (): Promise<boolean> =>
      page.getByTestId('COMMENT_QUEUED_TEXT').evaluate(QUEUED_TEXT_FITS_BROWSER_FN),

    // The exact DOM text content of the queued row — not Playwright's toHaveText, which
    // whitespace-normalizes both sides of the comparison and would collapse a real newline down
    // to a space on both the actual AND the expected string, silently passing either way. This is
    // the only path that can tell "a newline" apart from "a space" or "stripped/escaped markup".
    queuedTextExact: async (): Promise<CommentText> => {
      const text = await page.getByTestId('COMMENT_QUEUED_TEXT').textContent();
      if (text === null) {
        throw new Error('COMMENT_QUEUED_TEXT has no text content');
      }
      return commentTextContract.parse(text);
    },

    // The queue exactly as the browser stored it, with each createdAt that round-trips as a real ISO
    // timestamp swapped for a sentinel so the scenario can assert the whole entry at once.
    readQueue: async (): Promise<unknown> =>
      parseQueue(await readRawQueue()).map((entry) => {
        const { createdAt } = entry;
        const isIso =
          typeof createdAt === 'string' && new Date(createdAt).toISOString() === createdAt;
        return { ...entry, createdAt: isIso ? COMMENT_BOX_ISO_CREATED_AT : createdAt };
      }),

    hasQueueKey: async (): Promise<boolean> => (await readRawQueue()) !== null,

    captureQueueSnapshot: async (): Promise<void> => {
      captured.queueRaw = (await readRawQueue()) ?? '';
    },

    // Byte-identical comparison of the whole stored array, so a cancel that rewrote the entry with
    // the same text but a fresh createdAt still fails.
    queueUnchangedSinceCapture: async (): Promise<boolean> =>
      ((await readRawQueue()) ?? '') === captured.queueRaw,

    queueCreatedAtBumpedSinceCapture: async (): Promise<boolean> =>
      firstCreatedAtMs(await readRawQueue()) > firstCreatedAtMs(captured.queueRaw),
  };
};
