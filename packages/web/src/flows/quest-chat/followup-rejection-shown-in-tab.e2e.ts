import {
  AssistantTextStreamLineStub,
  SessionIdStub,
  SystemInitStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import {
  questStatusMetadataStatics,
  questStatusTransitionsStatics,
} from '@dungeonmaster/shared/statics';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { followupHarness } from '../../../test/harnesses/followup/followup.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-followup-rejection';

const HTTP_BAD_REQUEST = 400;
const HTTP_OK = 200;
const REJECTION_TIMEOUT = 8_000;
// A seed, a navigation, a tab press, a status move and a real send do not reliably fit the
// project's 10s default; test.setTimeout is lint-banned, so the describe-level lever is used.
const SUITE_TIMEOUT_MS = 30_000;

// The status the tab is OPENED at. It has to be follow-up-chatable, or there is no FOLLOW-UP button
// to press and no tab for a rejection to land in.
const OPENED_AT_STATUS = 'blocked';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

// Every status a `blocked` quest can legally move to that CANNOT take a follow-up — derived by
// crossing the transition map with the status metadata rather than hardcoding [in_progress,
// merging]. That crossing is the point: a gate proving only that it accepts blocked/complete/merged
// would still pass while also accepting paused or abandoned, so the rejection is asserted for
// statuses no observable names anywhere. The transition half is what keeps every case a move a real
// quest can make while its FOLLOW-UP tab is open, rather than an arbitrary status written to disk.
const BLOCKED_TRANSITION_TARGETS = questStatusTransitionsStatics[
  OPENED_AT_STATUS
] as readonly StatusKey[];
const REJECTED_TARGET_STATUSES = STATUSES.filter(
  (status) =>
    !questStatusMetadataStatics.statuses[status].isFollowupChatable &&
    BLOCKED_TRANSITION_TARGETS.includes(status),
);

// The verbatim body the follow-up route answers 400 with. Pinned as a whole string, never a
// substring of one shared word, because "the exact 400 body error text" is the observable.
const REJECTION_TEXT = 'Quest must be blocked, complete or merged for follow-up';

const QUESTION = 'Now that this is done, what is left over?';
// Hostile member of the follow-up message input class: one unbroken token with no break
// opportunity. The rejection has to stay about the quest's status, not become a report about the
// payload that happened to carry it.
const HOSTILE_TOKEN_PAD = 160;
const HOSTILE_QUESTION = `packages/server/src/responders/quest/followup/quest-followup-responder.ts:unbroken-token-with-no-break-opportunity-${'7'.repeat(HOSTILE_TOKEN_PAD)}`;
// The one non-chatable status a reader can reach by clicking a real control (the MERGE button on
// the EXECUTION tab moves a blocked quest to `merging` while the FOLLOW-UP tab stays open), which
// makes it the honest representative for the hostile-payload case.
const USER_REACHABLE_REJECTED_STATUS = 'merging';

const ACCEPTED_SESSION_ID = 'e2e-followup-rejection-accepted-0000000000f1';
const ASSISTANT_REPLY = 'Nothing is left over — the ledger drained clean.';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('FOLLOW-UP status rejection is shown in the tab', () => {
  test.describe.configure({ timeout: SUITE_TIMEOUT_MS });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // Guards the matrix below against silently emptying out. The loop generates one test per derived
  // status, so a statics change that made every reachable status follow-up-chatable would produce
  // ZERO rejection tests and leave the whole path uncovered behind a green suite.
  test('VALID: {statics} => the statuses a blocked quest can move to that cannot take a follow-up are exactly in_progress, paused, merging, abandoned', () => {
    expect(REJECTED_TARGET_STATUSES).toStrictEqual([
      'in_progress',
      'paused',
      'merging',
      'abandoned',
    ]);
  });

  // followup-rejection-shown-in-tab. The tab is opened while the quest can still take a follow-up,
  // the quest moves underneath it, and the message is typed into the REAL composer — the only way a
  // browser can reach a route that rejects every status the tab is normally offered on.
  for (const status of REJECTED_TARGET_STATUSES) {
    test(`INVALID: {FOLLOW-UP tab opened at blocked, quest moved to ${status} underneath} => the route answers 400 and the tab renders that exact body text`, async ({
      page,
      request,
    }) => {
      const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
      const { questId, questFilePath } = await followup.seedAndOpen({
        guildName: `Followup Rejection ${status} Guild`,
        status: OPENED_AT_STATUS,
      });

      await followup.pressFollowup();

      // Precondition, not the mutation under test.
      followup.setQuestStatusOnDisk({ questFilePath: String(questFilePath), status });

      // The tab is gated on having been pressed, never on quest status, so it is still the surface
      // the rejection has to land on — and reading it here keeps the send from racing a tab that
      // the status change tore down.
      expect(await followup.hasAnyFollowupTab()).toBe(true);

      const rejection = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().includes(`/api/quests/${String(questId)}/followup`),
      );

      await followup.sendFollowupMessage({ text: QUESTION });

      expect((await rejection).status()).toBe(HTTP_BAD_REQUEST);

      // The observable itself: the body the route answered, rendered verbatim inside the tab.
      await expect
        .poll(async () => followup.errorMessages(), { timeout: REJECTION_TIMEOUT })
        .toStrictEqual([REJECTION_TEXT]);

      // …beside the user's own turn, so the rejection reads as an answer to something rather than
      // as the whole content of a blank panel.
      expect(await followup.transcriptHasText({ text: QUESTION })).toBe(true);
    });
  }

  test(`EDGE: {quest moved to ${USER_REACHABLE_REJECTED_STATUS} underneath, message is one unbroken 200-character token} => the tab still renders that exact 400 body text`, async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    const { questFilePath } = await followup.seedAndOpen({
      guildName: 'Followup Rejection Hostile Guild',
      status: OPENED_AT_STATUS,
    });

    await followup.pressFollowup();
    followup.setQuestStatusOnDisk({
      questFilePath: String(questFilePath),
      status: USER_REACHABLE_REJECTED_STATUS,
    });

    await followup.sendFollowupMessage({ text: HOSTILE_QUESTION });

    await expect
      .poll(async () => followup.errorMessages(), { timeout: REJECTION_TIMEOUT })
      .toStrictEqual([REJECTION_TEXT]);

    expect(await followup.transcriptHasText({ text: HOSTILE_QUESTION })).toBe(true);
  });

  // The accepted half of the exclusion, and the non-vacuous partner for every empty/absent read
  // above: the SAME composer, the SAME errorMessages() selector, against a quest that never moved.
  // Without it a rejection that rendered on every send — or a selector that matched nothing — would
  // be indistinguishable from a gate that rejects exactly the wrong statuses.
  test('VALID: {FOLLOW-UP tab opened at blocked, quest still blocked} => the route answers 200 and the tab renders no error message at all', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });

    claudeMock.queueResponse({
      response: {
        sessionId: SessionIdStub({ value: ACCEPTED_SESSION_ID }),
        lines: [
          streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() }),
          streamLineToJsonLineTransformer({
            streamLine: AssistantTextStreamLineStub({
              message: { role: 'assistant', content: [{ type: 'text', text: ASSISTANT_REPLY }] },
            }),
          }),
        ],
      },
    });

    const { questId } = await followup.seedAndOpen({
      guildName: 'Followup Rejection Accepted Guild',
      status: OPENED_AT_STATUS,
    });

    await followup.pressFollowup();

    const accepted = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes(`/api/quests/${String(questId)}/followup`),
    );

    await followup.sendFollowupMessage({ text: QUESTION });

    expect((await accepted).status()).toBe(HTTP_OK);

    await expect(
      page.getByTestId('CHAT_PANEL').getByTestId('CHAT_MESSAGE').filter({ hasText: QUESTION }),
    ).toBeVisible({ timeout: REJECTION_TIMEOUT });

    expect(await followup.errorMessages()).toStrictEqual([]);
  });
});
