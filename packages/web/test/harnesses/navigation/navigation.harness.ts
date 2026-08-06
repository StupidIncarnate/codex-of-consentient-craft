/**
 * PURPOSE: Provides page navigation and replay helpers for E2E tests
 *
 * USAGE:
 * const nav = navigationHarness({ page });
 * await nav.navigateToQuest({ urlSlug: 'my-guild', questId: 'abc-123' });
 * await nav.navigateToSession({ urlSlug: 'my-guild', sessionId: 'abc-123' });
 * await nav.triggerReplayFromBrowser({ guildId: 'guild-id', sessionIds: ['s1', 's2'] });
 */
import type { Page } from '@playwright/test';

const HTTP_OK = 200;
const MODAL_DISMISS_TIMEOUT = 5_000;

export const navigationHarness = ({
  page,
}: {
  page: Page;
}): {
  navigateToQuest: (params: { urlSlug: string; questId: string }) => Promise<void>;
  navigateToSession: (params: { urlSlug: string; sessionId: string }) => Promise<void>;
  triggerReplayFromBrowser: (params: { guildId: string; sessionIds: string[] }) => Promise<void>;
  dismissApprovedModalIfPresent: () => Promise<void>;
} => {
  const navigateToQuest = async ({
    urlSlug,
    questId,
  }: {
    urlSlug: string;
    questId: string;
  }): Promise<void> => {
    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/quest/${questId}`);
    await guildsResponsePromise;
  };

  const navigateToSession = async ({
    urlSlug,
    sessionId,
  }: {
    urlSlug: string;
    sessionId: string;
  }): Promise<void> => {
    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session/${sessionId}`);
    await guildsResponsePromise;
  };

  const triggerReplayFromBrowser = async ({
    guildId,
    sessionIds,
  }: {
    guildId: string;
    sessionIds: string[];
  }): Promise<void> => {
    await page.evaluate(
      ({ guildId: gId, sessionIds: sIds }) => {
        const wsUrl = `ws://${globalThis.location.host}/ws`;
        const ws = new globalThis.WebSocket(wsUrl);
        ws.onopen = (): void => {
          for (const sid of sIds) {
            ws.send(
              JSON.stringify({
                type: 'replay-history',
                sessionId: sid,
                guildId: gId,
                chatProcessId: `replay-${sid}`,
              }),
            );
          }
          globalThis.setTimeout(() => {
            ws.close();
          }, 500);
        };
      },
      { guildId, sessionIds },
    );
  };

  // An approved quest surfaces the Begin Quest modal on load and its overlay intercepts every
  // canvas/panel click underneath it. A reviewer dismisses it via Keep Chatting to reach the
  // content behind it — do the same. The modal itself is precondition state owned by
  // quest-approved-modal.e2e, so dismissing it here bypasses no control the calling flow is
  // testing. A no-op when the modal never renders (e.g. status precedes `approved`).
  const dismissApprovedModalIfPresent = async (): Promise<void> => {
    const keepChatting = page.getByTestId('PIXEL_BTN').filter({ hasText: 'Keep Chatting' });
    if (await keepChatting.isVisible().catch(() => false)) {
      await keepChatting.click();
      await page
        .getByTestId('QUEST_APPROVED_MODAL_TITLE')
        .waitFor({ state: 'hidden', timeout: MODAL_DISMISS_TIMEOUT });
    }
  };

  return {
    navigateToQuest,
    navigateToSession,
    triggerReplayFromBrowser,
    dismissApprovedModalIfPresent,
  };
};
