/**
 * PURPOSE: Seeds a sub-agent that launches a BACKGROUND sub-agent halfway through its own transcript,
 * then reads back the order the browser painted the parent chain's contents in. Where a nested chain
 * lands is a layout fact rather than a data fact — the group tree can carry the chain in the right
 * slot while the widget still paints every nested chain after every single entry — so only a measured
 * top offset separates the two. Reach for this over `stickyHeaderHarness` when the question is WHERE
 * inside a chain something painted rather than whether a header is held out of flow.
 *
 * USAGE:
 * const launches = subagentLaunchOrderHarness({ page, request, guildPath, sessions });
 * await launches.seedBackgroundLaunchQuest({ guildName: 'Launch Order Guild' });
 * await launches.revealParentChainEntries();
 * expect(await launches.paintedOrderInParentChainIs({ order: 'parentBefore|nestedChain' })).toBe(true);
 */
import type { APIRequestContext, Page } from '@playwright/test';

import {
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  TaskToolResultStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { guildHarness } from '../guild/guild.harness';
import { navigationHarness } from '../navigation/navigation.harness';
import { questHarness } from '../quest/quest.harness';
import type { sessionHarness } from '../session/session.harness';

const PANEL_TIMEOUT = 5_000;
const CHAIN_TIMEOUT = 15_000;
// The execution panel's scrollport. Restated rather than imported: a harness may not import widgets,
// and the testid is part of the observable being asserted anyway.
const EXECUTION_SCROLLPORT = 'execution-panel-floor-content';

const PARENT_TOOL_USE_ID = 'toolu_e2e_launch_order_parent';
const NESTED_TOOL_USE_ID = 'toolu_e2e_launch_order_nested';
const PARENT_DESCRIPTION = 'Planner minion for round 1';
const NESTED_DESCRIPTION = 'Background explorer for the shared slice';
// Claude CLI copies a Task's `input.prompt` verbatim into the spawned sub-agent JSONL's first
// user-text line, and for a BACKGROUND launch that byte-equality is the only cross-file link there
// is — the acknowledgement tool_result carries no `toolUseResult` to correlate on. Both sides read
// this constant so the two strings cannot drift apart.
const NESTED_PROMPT = 'Explore the shared slice and report the contracts it owns.';

// The four things whose painted order this harness reports. `nestedChain` is the nested chain's own
// header text; the other three are lines in the PARENT sub-agent's transcript — one before the
// launch, two after it.
export const subagentLaunchOrderMarkers = {
  parentBefore: 'PARENT_BEFORE_marker_AAA',
  nestedChain: NESTED_DESCRIPTION,
  asyncAck: 'ASYNC_LAUNCH_ACK_marker_CCC',
  parentAfter: 'PARENT_AFTER_marker_ZZZ',
} as const;

const MARKER_PROBES = [
  { key: 'parentBefore', text: subagentLaunchOrderMarkers.parentBefore },
  { key: 'nestedChain', text: subagentLaunchOrderMarkers.nestedChain },
  { key: 'asyncAck', text: subagentLaunchOrderMarkers.asyncAck },
  { key: 'parentAfter', text: subagentLaunchOrderMarkers.parentAfter },
];

// Monotonically increasing across all three seeded files. The replay broker sorts every line into
// ONE timestamp-ordered stream, so chain A has to exist before chain B reparents under it, and the
// launch has to sort between the parent's own two text lines or the fixture cannot tell a chain
// painted at its launch point from one painted at the end.
const TIMESTAMPS = {
  kickoff: '2026-06-02T20:00:00.000Z',
  launchParent: '2026-06-02T20:00:01.000Z',
  parentBefore: '2026-06-02T20:00:02.000Z',
  launchNested: '2026-06-02T20:00:03.000Z',
  nestedAck: '2026-06-02T20:00:04.000Z',
  parentAfter: '2026-06-02T20:00:05.000Z',
  nestedBody: '2026-06-02T20:00:06.000Z',
  parentComplete: '2026-06-02T20:00:20.000Z',
} as const;

// Reads each marker's painted top offset inside the PARENT chain's box and returns the markers
// sorted by it, `|`-joined. A marker the parent chain does not contain is simply absent from the
// run — which is what a nested chain stranded OUTSIDE its parent looks like from here.
const PAINTED_ORDER_BROWSER_FN = ({
  chainDescription,
  probes,
}: {
  chainDescription: string;
  probes: { key: string; text: string }[];
}) => {
  const chains = Array.from(document.querySelectorAll('[data-testid="SUBAGENT_CHAIN"]'));
  const parent = chains.find((chain) => {
    const header = chain.querySelector('[data-testid="SUBAGENT_CHAIN_HEADER"]');
    return header !== null && (header.textContent ?? '').includes(chainDescription);
  });

  if (parent === undefined) {
    return null;
  }

  // Probe the TEXT NODE carrying each marker and measure its own element, so the offset is the
  // marker's painted position rather than that of whatever box happens to contain it.
  const measured = probes.map((probe) => {
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node !== null) {
      const owner = node.parentElement;
      if (owner !== null && (node.textContent ?? '').includes(probe.text)) {
        return { key: probe.key, top: owner.getBoundingClientRect().top, found: true };
      }
      node = walker.nextNode();
    }

    return { key: probe.key, top: 0, found: false };
  });

  const found = measured.filter((entry) => entry.found);
  found.sort((a, b) => a.top - b.top);

  return { order: found.map((entry) => entry.key).join('|') };
};

export const subagentLaunchOrderHarness = ({
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
  seedBackgroundLaunchQuest: (params: { guildName: string }) => Promise<void>;
  revealParentChainEntries: () => Promise<void>;
  paintedOrderInParentChainIs: (params: { order: string }) => Promise<boolean>;
} => {
  // Sub-agent A's transcript in the shape a background launch really has: A says something, fires an
  // Agent tool_use, gets an immediate acknowledgement back carrying NO `toolUseResult`, and carries
  // on talking while B runs. A itself is a normal awaited Task, so its own completion tool_result in
  // the main session does carry one — the two correlation paths side by side, as on a real quest.
  const seedSession = ({
    sessionId,
    parentRealAgentId,
    nestedRealAgentId,
  }: {
    sessionId: string;
    parentRealAgentId: string;
    nestedRealAgentId: string;
  }): void => {
    sessions.createMultiEntrySessionFile({
      sessionId,
      lines: [
        JSON.stringify({
          ...UserTextStringStreamLineStub({
            message: { role: 'user', content: 'Build the shared slice' },
          }),
          uuid: `${sessionId}-user`,
          timestamp: TIMESTAMPS.kickoff,
        }),
        JSON.stringify({
          ...AssistantTaskToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: PARENT_TOOL_USE_ID,
                  name: 'Agent',
                  input: {
                    description: PARENT_DESCRIPTION,
                    prompt: 'Plan round 1',
                    subagent_type: 'general-purpose',
                  },
                },
              ],
            },
          }),
          uuid: `${sessionId}-task-a`,
          timestamp: TIMESTAMPS.launchParent,
        }),
        JSON.stringify({
          ...TaskToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [{ type: 'tool_result', tool_use_id: PARENT_TOOL_USE_ID, content: 'done' }],
            },
            toolUseResult: { agentId: parentRealAgentId },
          }),
          uuid: `${sessionId}-task-a-result`,
          timestamp: TIMESTAMPS.parentComplete,
        }),
      ],
    });

    sessions.createSubagentTailMultiEntry({
      sessionId,
      agentId: parentRealAgentId,
      lines: [
        JSON.stringify({
          ...AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: subagentLaunchOrderMarkers.parentBefore }],
              usage: { input_tokens: 60, output_tokens: 20 },
            },
          }),
          uuid: `${sessionId}-a-before`,
          timestamp: TIMESTAMPS.parentBefore,
        }),
        JSON.stringify({
          ...AssistantTaskToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: NESTED_TOOL_USE_ID,
                  name: 'Agent',
                  input: {
                    description: NESTED_DESCRIPTION,
                    prompt: NESTED_PROMPT,
                    subagent_type: 'Explore',
                  },
                },
              ],
            },
          }),
          uuid: `${sessionId}-task-b`,
          timestamp: TIMESTAMPS.launchNested,
        }),
        // Verbatim shape of a `run_in_background` acknowledgement: an ARRAY of text blocks, and no
        // `toolUseResult` key at all. That absence is the whole point of this fixture — it is what
        // leaves the replay pre-scan nothing to correlate on except the prompt text below.
        JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: NESTED_TOOL_USE_ID,
                  content: [
                    {
                      type: 'text',
                      text: `Async agent launched successfully. ${subagentLaunchOrderMarkers.asyncAck} agentId: ${nestedRealAgentId}`,
                    },
                  ],
                },
              ],
            },
          }),
          uuid: `${sessionId}-task-b-ack`,
          timestamp: TIMESTAMPS.nestedAck,
        }),
        JSON.stringify({
          ...AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: subagentLaunchOrderMarkers.parentAfter }],
              usage: { input_tokens: 90, output_tokens: 25 },
            },
          }),
          uuid: `${sessionId}-a-after`,
          timestamp: TIMESTAMPS.parentAfter,
        }),
      ],
    });

    sessions.createSubagentTailMultiEntry({
      sessionId,
      agentId: nestedRealAgentId,
      lines: [
        JSON.stringify({
          ...UserTextStringStreamLineStub({
            message: { role: 'user', content: NESTED_PROMPT },
          }),
          uuid: `${sessionId}-b-prompt`,
          timestamp: TIMESTAMPS.nestedBody,
        }),
        JSON.stringify({
          ...AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'NESTED_BODY_marker_BBB' }],
              usage: { input_tokens: 40, output_tokens: 15 },
            },
          }),
          uuid: `${sessionId}-b-body`,
          timestamp: TIMESTAMPS.nestedBody,
        }),
      ],
    });
  };

  return {
    // An `in_progress` work item auto-opens its execution row, so both chains are on screen — the
    // arrangement the reader saw the background explorers stranded in.
    seedBackgroundLaunchQuest: async ({ guildName }: { guildName: string }): Promise<void> => {
      const guilds = guildHarness({ request });
      const quests = questHarness({ request });
      const nav = navigationHarness({ page });
      const guild = await guilds.createGuild({ name: guildName, path: guildPath });
      const stamp = String(Date.now());
      const sessionId = `e2e-launch-order-${stamp}`;

      seedSession({
        sessionId,
        parentRealAgentId: `launchparent${stamp}`,
        nestedRealAgentId: `launchnested${stamp}`,
      });

      const created = await quests.createQuest({
        guildId: String(guild.id),
        title: 'E2E Background Launch Order Quest',
        userRequest: 'Build the shared slice',
      });

      quests.writeQuestFile({
        questId: String(created.questId),
        questFolder: String(created.questFolder),
        questFilePath: String(created.filePath),
        status: 'in_progress',
        workItems: [
          {
            id: 'e2e00000-0000-4000-8000-0000000000b1',
            role: 'codeweaver',
            sessionId,
            status: 'in_progress',
          },
        ],
      });

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

    // The parent chain opens on its tail window, which hides everything before its last message.
    // Its own toggle is the FIRST in the panel — the parent's contents precede any nested chain's —
    // so clicking that puts the whole transcript on screen. The scrollport then goes back to the top
    // so no sticky header is being held out of flow when the rects are read.
    revealParentChainEntries: async (): Promise<void> => {
      await page.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE').first().click();
      await page.getByTestId(EXECUTION_SCROLLPORT).evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.waitForFunction(
        (testId) => {
          const el = document.querySelector(`[data-testid="${testId}"]`);
          return el !== null && el.scrollTop === 0;
        },
        EXECUTION_SCROLLPORT,
        { timeout: PANEL_TIMEOUT },
      );
    },

    // Throws with the order it actually measured rather than returning false, so a failing run names
    // the arrangement on screen instead of leaving the reader to diff two booleans.
    paintedOrderInParentChainIs: async ({ order }: { order: string }): Promise<boolean> => {
      const result = await page.evaluate(PAINTED_ORDER_BROWSER_FN, {
        chainDescription: PARENT_DESCRIPTION,
        probes: MARKER_PROBES,
      });

      if (result === null) {
        throw new Error(`No SUBAGENT_CHAIN on the page whose header names "${PARENT_DESCRIPTION}"`);
      }

      if (result.order !== order) {
        throw new Error(
          `Painted order inside the "${PARENT_DESCRIPTION}" chain is "${result.order}", expected "${order}"`,
        );
      }

      return true;
    },
  };
};
