import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { QuestQueueEntryStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { QuestQueueBarWidget } from './quest-queue-bar-widget';
import { QuestQueueBarWidgetProxy } from './quest-queue-bar-widget.proxy';

describe('QuestQueueBarWidget', () => {
  describe('empty queue', () => {
    it('EMPTY: {allEntries=[]} => renders nothing', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      proxy.setupEntries({ entries: [] });

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(queryByTestId('QUEST_QUEUE_BAR')).toBe(null);
      });

      expect(queryByTestId('QUEST_QUEUE_BAR')).toBe(null);
    });
  });

  describe('collapsed view', () => {
    it('VALID: {1 entry} => renders Quest 1/1 — title', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const entries = [QuestQueueEntryStub({ questId: 'q-1', questTitle: 'Alpha' })];
      proxy.setupEntries({ entries });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      const label = await findByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL');

      expect(label.textContent).toBe('Quest 1/1 — Alpha');
    });

    it('VALID: {2 entries} => renders Quest 1/2 — <head title>', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const entries = [
        QuestQueueEntryStub({ questId: 'q-a', questTitle: 'Head Title' }),
        QuestQueueEntryStub({ questId: 'q-b', questTitle: 'Tail Title' }),
      ];
      proxy.setupEntries({ entries });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      const label = await findByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL');

      expect(label.textContent).toBe('Quest 1/2 — Head Title');
    });

    it('VALID: {head has error} => renders error badge', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const entries = [
        QuestQueueEntryStub({
          questId: 'q-err',
          questTitle: 'Errored',
          error: {
            message: 'runner threw' as never,
            at: '2024-01-15T10:06:00.000Z' as never,
          },
        }),
      ];
      proxy.setupEntries({ entries });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      const badge = await findByTestId('QUEST_QUEUE_BAR_ERROR_BADGE');

      expect(badge.getAttribute('title')).toBe('runner threw');
    });

    it('VALID: {head has no error} => does NOT render error badge', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const entries = [QuestQueueEntryStub({ questId: 'q-ok', questTitle: 'Healthy' })];
      proxy.setupEntries({ entries });

      const { findByTestId, queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      await findByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL');

      expect(queryByTestId('QUEST_QUEUE_BAR_ERROR_BADGE')).toBe(null);
    });
  });

  describe('open link', () => {
    it('VALID: {head entry} => OPEN link href targets that quest', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const head = QuestQueueEntryStub({
        questId: 'q-open',
        questTitle: 'Smoketest: Signals',
        guildSlug: 'smoketests-guild' as never,
        activeSessionId: SessionIdStub({ value: 'sess-open' }),
      });
      proxy.setupEntries({ entries: [head] });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      const openLink = await findByTestId('QUEST_QUEUE_BAR_OPEN_LINK');

      expect(openLink.getAttribute('href')).toBe('/smoketests-guild/quest/q-open');
    });

    it('VALID: {head without activeSessionId} => OPEN link still targets the quest', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const head = QuestQueueEntryStub({
        questId: 'q-pending',
        questTitle: 'Planning',
        guildSlug: 'guild-x' as never,
      });
      proxy.setupEntries({ entries: [head] });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      const openLink = await findByTestId('QUEST_QUEUE_BAR_OPEN_LINK');

      expect(openLink.getAttribute('href')).toBe('/guild-x/quest/q-pending');
    });
  });

  describe('websocket updates', () => {
    it('VALID: {execution-queue-updated WS} => widget re-renders with new entries', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      proxy.setupEntries({ entries: [QuestQueueEntryStub({ questId: 'q-1', questTitle: 'First' })] });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      await findByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL');

      proxy.setupEntries({
        entries: [
          QuestQueueEntryStub({ questId: 'q-1', questTitle: 'First' }),
          QuestQueueEntryStub({ questId: 'q-2', questTitle: 'Second' }),
        ],
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.websocket.receiveMessage({
            data: JSON.stringify({
              type: 'execution-queue-updated',
              payload: {},
              timestamp: '2026-05-05T13:00:00.000Z',
            }),
          });
        },
      });

      await waitFor(() => {
        expect((document.querySelector('[data-testid="QUEST_QUEUE_BAR_COLLAPSED_LABEL"]') as HTMLElement).textContent).toBe('Quest 1/2 — First');
      });

      const label = await findByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL');

      expect(label.textContent).toBe('Quest 1/2 — First');
    });

    it('VALID: {execution-queue-error WS} => widget re-renders with error badge', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      proxy.setupEntries({ entries: [QuestQueueEntryStub({ questId: 'q-1', questTitle: 'First' })] });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      await findByTestId('QUEST_QUEUE_BAR_COLLAPSED_LABEL');

      proxy.setupEntries({
        entries: [
          QuestQueueEntryStub({
            questId: 'q-err',
            questTitle: 'Errored',
            error: {
              message: 'runner threw' as never,
              at: '2024-01-15T10:06:00.000Z' as never,
            },
          }),
        ],
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.websocket.receiveMessage({
            data: JSON.stringify({
              type: 'execution-queue-error',
              payload: {},
              timestamp: '2026-05-05T13:00:00.000Z',
            }),
          });
        },
      });

      const badge = await findByTestId('QUEST_QUEUE_BAR_ERROR_BADGE');

      expect(badge.getAttribute('title')).toBe('runner threw');
    });
  });

  describe('expanded view', () => {
    it('VALID: {click chevron} => renders one row per entry with correct href', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const head = QuestQueueEntryStub({
        questId: 'q-a',
        questTitle: 'Alpha',
        guildSlug: 'guild-one' as never,
        activeSessionId: SessionIdStub({ value: 'sess-a' }),
      });
      const tail = QuestQueueEntryStub({
        questId: 'q-b',
        questTitle: 'Beta',
        guildSlug: 'guild-two' as never,
        activeSessionId: SessionIdStub({ value: 'sess-b' }),
      });
      proxy.setupEntries({ entries: [head, tail] });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      const toggle = await findByTestId('QUEST_QUEUE_BAR_TOGGLE');
      await userEvent.click(toggle);

      const rowA = await findByTestId('QUEST_QUEUE_BAR_ROW_Q-A');
      const rowB = await findByTestId('QUEST_QUEUE_BAR_ROW_Q-B');

      expect(rowA.getAttribute('href')).toBe('/guild-one/quest/q-a');
      expect(rowB.getAttribute('href')).toBe('/guild-two/quest/q-b');
    });

    it('VALID: {entry without activeSessionId} => row still links to /quest/:questId', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const head = QuestQueueEntryStub({
        questId: 'q-no-session',
        questTitle: 'Planning',
        guildSlug: 'guild-foo' as never,
      });
      proxy.setupEntries({ entries: [head] });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      const toggle = await findByTestId('QUEST_QUEUE_BAR_TOGGLE');
      await userEvent.click(toggle);

      const row = await findByTestId('QUEST_QUEUE_BAR_ROW_Q-NO-SESSION');

      expect(row.getAttribute('href')).toBe('/guild-foo/quest/q-no-session');
    });

    it('VALID: {toggle twice} => collapses list again', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const entries = [QuestQueueEntryStub({ questId: 'q-a', questTitle: 'Alpha' })];
      proxy.setupEntries({ entries });

      const { findByTestId, queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      const toggle = await findByTestId('QUEST_QUEUE_BAR_TOGGLE');
      await userEvent.click(toggle);
      await findByTestId('QUEST_QUEUE_BAR_EXPANDED_LIST');
      await userEvent.click(toggle);

      expect(queryByTestId('QUEST_QUEUE_BAR_EXPANDED_LIST')).toBe(null);
    });

    it('VALID: {entry has error} => row renders red error badge', async () => {
      const proxy = QuestQueueBarWidgetProxy();
      const entries = [
        QuestQueueEntryStub({
          questId: 'q-err',
          questTitle: 'Errored',
          error: {
            message: 'boom' as never,
            at: '2024-01-15T10:06:00.000Z' as never,
          },
        }),
      ];
      proxy.setupEntries({ entries });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestQueueBarWidget />
          </MemoryRouter>
        ),
      });

      const toggle = await findByTestId('QUEST_QUEUE_BAR_TOGGLE');
      await userEvent.click(toggle);

      const rowBadge = await findByTestId('QUEST_QUEUE_BAR_ROW_ERROR_Q-ERR');

      expect(rowBadge.getAttribute('title')).toBe('boom');
    });
  });
});
