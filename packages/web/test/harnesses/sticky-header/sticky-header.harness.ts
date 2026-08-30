/**
 * PURPOSE: Seeds transcripts tall enough that their expandable headers actually pin, then measures
 * the resulting stack in a real browser. Whether a `position: sticky` chain RESOLVES is not
 * knowable from the declared style — jsdom reports `top: 23px` on a header that is painting
 * nowhere near 23px, and reports nothing at all about whether an inner header slid across an outer
 * one on its way up. So the widget tests own the declared offsets and these helpers own the
 * painted result: what is currently held out of flow, in what order, and whether anything shows
 * through it.
 *
 * USAGE:
 * const sticky = stickyHeaderHarness({ page, request, guildPath, sessions });
 * await sticky.seedNestedChainQuest({ guildName: 'Sticky Guild' });
 * await sticky.scrollTranscriptToFoot();
 * expect(await sticky.pinnedStackIs({ testIds: 'execution-row-header|SUBAGENT_CHAIN_HEADER' })).toBe(true);
 */
import type { APIRequestContext, Page } from '@playwright/test';

import {
  AssistantReadToolUseStreamLineStub,
  SuccessfulToolResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { guildHarness } from '../guild/guild.harness';
import { navigationHarness } from '../navigation/navigation.harness';
import { questHarness } from '../quest/quest.harness';
import type { sessionHarness } from '../session/session.harness';

const PANEL_TIMEOUT = 5_000;
const CHAIN_TIMEOUT = 10_000;
// The two scrollports an expandable can pin against. Restated rather than imported: a harness may
// not import widgets, and the testid is the observable being asserted anyway.
const EXECUTION_SCROLLPORT = 'execution-panel-floor-content';
const CHAT_SCROLLPORT = 'CHAT_MESSAGES_AREA';
// Sticky offsets resolve to whole pixels in Chrome; one pixel of slack absorbs subpixel rounding on
// the scrollport's own border without letting a genuinely misplaced header pass.
const PIN_EPSILON_PX = 1;
// Chrome reports an unset background as this. A pinned header carrying it is transparent, and the
// transcript scrolling underneath reads straight through the bar.
const TRANSPARENT_COMPUTED = 'rgba(0, 0, 0, 0)';

// Long enough that each level's own box overruns a 720px viewport several times over, which is the
// precondition for pinning at all: a sticky header can only be held out of flow while the box it
// belongs to still spans the scrollport. Built inline so the harness carries no fixture file.
const TALL_TEXT = Array.from(
  { length: 120 },
  (_unused, i) =>
    `Line ${i + 1} of the sub-agent's report, long enough to wrap and stack into a transcript that scrolls well past a single screen height.`,
).join('\n\n');

// A tool call inside the tall chain, left CLOSED by every test that seeds it. Its header declares
// `position: sticky` unconditionally, and the claim that the declaration is inert while the row is
// closed — its containing block is exactly the header, so there is nowhere to travel — is a real
// browser's to answer.
const CLOSED_TOOL_USE_ID = 'toolu_e2e_sticky_closed_tool';

// Collects every expandable header that is CURRENTLY PINNED, in painted order. "Pinned" is two
// conditions, not one: the header sits at the offset it declared AND the box it belongs to has
// scrolled above that offset. The second is what separates a held header from one that merely
// happens to be passing that point in normal flow, and it is the only reason this can tell a
// working sticky chain from a dead one.
const PINNED_STACK_BROWSER_FN = ({
  portTestId,
  epsilon,
}: {
  portTestId: string;
  epsilon: number;
}) => {
  const port = document.querySelector(`[data-testid="${portTestId}"]`);
  if (port === null) {
    return null;
  }
  const portRect = port.getBoundingClientRect();
  const headers = Array.from(
    document.querySelectorAll(
      '[data-testid="execution-row-header"],[data-testid="SUBAGENT_CHAIN_HEADER"],[data-testid="TOOL_ROW_HEADER"]',
    ),
  );

  const measured = headers.map((el) => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const owner = el.parentElement;
    const ownerRect = owner === null ? rect : owner.getBoundingClientRect();
    const declaredTop = Number.parseInt(style.top, 10);
    // Probed at the header's OWN centre, not at a fixed inset from the scrollport: each level is
    // indented further right than the one above it, so a fixed inset samples outside a nested
    // header's box and reports whatever is behind it.
    const probe = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

    return {
      testId: el.getAttribute('data-testid') ?? '',
      declaredTop,
      offsetTop: rect.top - portRect.top,
      offsetBottom: rect.bottom - portRect.top,
      zIndex: Number(style.zIndex),
      background: style.backgroundColor,
      isSticky: style.position === 'sticky',
      // The header's own box has outlived its owner's top edge — it is being HELD here.
      isHeld: ownerRect.top < portRect.top + declaredTop - epsilon,
      // Nothing is painted over this bar at its own midpoint.
      ownsItsPixels: probe !== null && el.contains(probe),
    };
  });

  const pinned = measured
    .filter(
      (h) =>
        h.isSticky &&
        h.isHeld &&
        Number.isFinite(h.declaredTop) &&
        Math.abs(h.offsetTop - h.declaredTop) <= epsilon,
    )
    .sort((a, b) => a.offsetTop - b.offsetTop);

  return { pinned };
};

export const stickyHeaderHarness = ({
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
  seedNestedChainQuest: (params: { guildName: string }) => Promise<void>;
  seedChatPanelChain: (params: { guildName: string }) => Promise<void>;
  scrollTranscriptToFoot: () => Promise<void>;
  pinnedStackIs: (params: { testIds: string }) => Promise<boolean>;
  pinnedStackIsContiguous: () => Promise<boolean>;
  pinnedStackPaintsOutermostOnTop: () => Promise<boolean>;
  pinnedHeadersAreOpaque: () => Promise<boolean>;
  pinnedHeadersOwnTheirPixels: () => Promise<boolean>;
  topPinnedHeaderIsFlushWithScrollportTop: () => Promise<boolean>;
} => {
  // Which scrollport the seeded surface pins against. Set by whichever seed method ran.
  let scrollportTestId = EXECUTION_SCROLLPORT;

  const readPinnedStack = async () => {
    const result = await page.evaluate(PINNED_STACK_BROWSER_FN, {
      portTestId: scrollportTestId,
      epsilon: PIN_EPSILON_PX,
    });
    if (result === null) {
      throw new Error(`Scrollport [data-testid="${scrollportTestId}"] is not on the page`);
    }
    return result.pinned;
  };

  // Both surfaces read the same seeded session, so the chain shape is built once. Chain A holds a
  // tall report, a CLOSED tool call, and the nested chain B — so one fixture exercises the outer
  // pin, the recursive pin, and the closed-row negative together.
  const seedNestedChainSession = () => {
    const sessionId = `e2e-sticky-${Date.now()}`;
    const parentRealAgentId = `stickyparent${Date.now()}`;
    const nestedRealAgentId = `stickynested${Date.now()}`;

    sessions.createNestedSubagentSessionFiles({
      sessionId,
      parentRealAgentId,
      nestedRealAgentId,
      parentToolUseId: 'toolu_e2e_sticky_parent',
      nestedToolUseId: 'toolu_e2e_sticky_nested',
      userMessage: 'Build the sticky header feature',
      parentDescription: 'Outer chain that owns the tall report',
      nestedDescription: 'Inner chain nested inside the outer one',
      parentText: TALL_TEXT,
      nestedText: TALL_TEXT,
    });

    // Timestamps land between chain B's launch (offset 3s) and the main session's completion of
    // chain A (offset 10s), so the pair sorts INSIDE chain A rather than after it — as a sibling
    // BELOW the nested chain, which is where a closed row has to sit for the negative case to
    // mean anything: it is the last thing in the transcript while three headers above it pin.
    sessions.appendSubagentLine({
      sessionId,
      agentId: parentRealAgentId,
      line: JSON.stringify({
        ...AssistantReadToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: CLOSED_TOOL_USE_ID,
                name: 'Read',
                input: { file_path: '/tmp/sticky-closed-row.ts' },
              },
            ],
          },
        }),
        uuid: `${sessionId}-closed-tool-use`,
        timestamp: new Date('2026-05-13T20:00:06.000Z').toISOString(),
      }),
    });
    sessions.appendSubagentLine({
      sessionId,
      agentId: parentRealAgentId,
      line: JSON.stringify({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: CLOSED_TOOL_USE_ID,
                content: 'the closed row body',
              },
            ],
          },
        }),
        uuid: `${sessionId}-closed-tool-result`,
        timestamp: new Date('2026-05-13T20:00:07.000Z').toISOString(),
      }),
    });

    return sessionId;
  };

  return {
    // The execution surface: an in_progress work item auto-opens its row, so the transcript is on
    // screen with the row header above it — the arrangement the outermost pin exists for.
    seedNestedChainQuest: async ({ guildName }: { guildName: string }): Promise<void> => {
      const guilds = guildHarness({ request });
      const quests = questHarness({ request });
      const nav = navigationHarness({ page });
      const guild = await guilds.createGuild({ name: guildName, path: guildPath });
      const sessionId = seedNestedChainSession();

      const created = await quests.createQuest({
        guildId: String(guild.id),
        title: 'E2E Sticky Header Quest',
        userRequest: 'Build the sticky header feature',
      });

      quests.writeQuestFile({
        questId: String(created.questId),
        questFolder: String(created.questFolder),
        questFilePath: String(created.filePath),
        status: 'in_progress',
        workItems: [
          {
            id: 'e2e00000-0000-4000-8000-0000000000a1',
            role: 'codeweaver',
            sessionId,
            status: 'in_progress',
          },
        ],
      });

      scrollportTestId = EXECUTION_SCROLLPORT;
      await nav.navigateToQuest({
        urlSlug: guilds.extractUrlSlug({ guild }),
        questId: String(created.questId),
      });
      await page
        .getByTestId('execution-panel-widget')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
      await page
        .getByTestId('SUBAGENT_CHAIN_HEADER')
        .nth(1)
        .waitFor({ state: 'visible', timeout: CHAIN_TIMEOUT });
    },

    // The chat surface: the same transcript on the session route, where a chain is the OUTERMOST
    // expandable and must pin flush with the top of the transcript area.
    seedChatPanelChain: async ({ guildName }: { guildName: string }): Promise<void> => {
      const guilds = guildHarness({ request });
      const nav = navigationHarness({ page });
      const guild = await guilds.createGuild({ name: guildName, path: guildPath });
      const sessionId = seedNestedChainSession();

      scrollportTestId = CHAT_SCROLLPORT;
      await nav.navigateToSession({
        urlSlug: guilds.extractUrlSlug({ guild }),
        sessionId,
      });
      await page.getByTestId(CHAT_SCROLLPORT).waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
      await page
        .getByTestId('SUBAGENT_CHAIN_HEADER')
        .first()
        .waitFor({ state: 'visible', timeout: CHAIN_TIMEOUT });
    },

    // Drives every level's box past the top of the scrollport at once, which is the only position
    // where the whole stack is pinned simultaneously and therefore the only one that can show two
    // bars overlapping or a gap opening between them.
    scrollTranscriptToFoot: async (): Promise<void> => {
      const port = page.getByTestId(scrollportTestId);
      await port.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForFunction(
        (testId) => {
          const el = document.querySelector(`[data-testid="${testId}"]`);
          return el !== null && el.scrollTop > 0;
        },
        scrollportTestId,
        { timeout: PANEL_TIMEOUT },
      );
    },

    // The pinned set, as a `|`-joined run of testids in painted order. Asserting the WHOLE run
    // rather than the presence of one header is what catches a closed row that pinned when it
    // should not have — an extra entry fails, where a per-header check would never look.
    pinnedStackIs: async ({ testIds }: { testIds: string }): Promise<boolean> => {
      const pinned = await readPinnedStack();
      return pinned.map((h) => h.testId).join('|') === testIds;
    },

    // Each bar starts exactly where the one above it ends. A gap is a strip of transcript scrolling
    // between two pinned headers; an overlap is one bar eating the other's label. Both look like
    // "sticky works" to any check that only asks whether a header is visible.
    pinnedStackIsContiguous: async (): Promise<boolean> => {
      const pinned = await readPinnedStack();
      return (
        pinned.length > 0 &&
        pinned.every(
          (header, index) =>
            index === 0 ||
            Math.abs(header.offsetTop - (pinned[index - 1]?.offsetBottom ?? 0)) <= PIN_EPSILON_PX,
        )
      );
    },

    // An inner header sits later in the DOM, so at `z-index: auto` it paints OVER the outer one it
    // is nested in and slides across it on the way up. Strictly decreasing bands are what stop that.
    pinnedStackPaintsOutermostOnTop: async (): Promise<boolean> => {
      const pinned = await readPinnedStack();
      return (
        pinned.length > 0 &&
        pinned.every(
          (header, index) => index === 0 || header.zIndex < (pinned[index - 1]?.zIndex ?? 0),
        )
      );
    },

    // Two of these headers are transparent when they are not pinned. Held out of flow, a transparent
    // bar lets the transcript scroll straight through the text it is showing.
    pinnedHeadersAreOpaque: async (): Promise<boolean> => {
      const pinned = await readPinnedStack();
      return (
        pinned.length > 0 && pinned.every((header) => header.background !== TRANSPARENT_COMPUTED)
      );
    },

    pinnedHeadersOwnTheirPixels: async (): Promise<boolean> => {
      const pinned = await readPinnedStack();
      return pinned.length > 0 && pinned.every((header) => header.ownsItsPixels);
    },

    // Flush means flush: offset zero against the scrollport's own top edge. A scrollport carrying
    // `padding-top` pins its headers that far down instead, and the transcript keeps scrolling
    // through the strip above them — visible only in a browser, and only while scrolling.
    topPinnedHeaderIsFlushWithScrollportTop: async (): Promise<boolean> => {
      const [top] = await readPinnedStack();
      return top !== undefined && Math.abs(top.offsetTop) <= PIN_EPSILON_PX;
    },
  };
};
