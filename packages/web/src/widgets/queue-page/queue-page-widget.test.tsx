import { MemoryRouter } from 'react-router-dom';

import { DispatchStateStub, QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QueuePageWidget } from './queue-page-widget';
import { QueuePageWidgetProxy } from './queue-page-widget.proxy';

describe('QueuePageWidget', () => {
  describe('empty queue', () => {
    it('EMPTY: {allEntries=[]} => renders empty state message', async () => {
      const proxy = QueuePageWidgetProxy();
      proxy.setupEntries({ entries: [] });
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueuePageWidget />
          </MemoryRouter>
        ),
      });

      const empty = await findByTestId('QUEUE_PAGE_EMPTY');

      expect(empty.textContent).toBe('The queue is empty.');
    });
  });

  describe('queue rows', () => {
    it('VALID: {2 entries} => head row renders title, status, guild slug, and position', async () => {
      const proxy = QueuePageWidgetProxy();
      const head = QuestQueueEntryStub({
        questId: 'q-a',
        questTitle: 'Alpha Quest',
        guildSlug: 'guild-one' as never,
        status: 'in_progress' as never,
      });
      const tail = QuestQueueEntryStub({
        questId: 'q-b',
        questTitle: 'Beta Quest',
        guildSlug: 'guild-two' as never,
        status: 'approved' as never,
      });
      proxy.setupEntries({ entries: [head, tail] });
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueuePageWidget />
          </MemoryRouter>
        ),
      });

      const titleA = await findByTestId('QUEUE_PAGE_ROW_TITLE_Q-A');
      const statusA = await findByTestId('QUEUE_PAGE_ROW_STATUS_Q-A');
      const guildA = await findByTestId('QUEUE_PAGE_ROW_GUILD_Q-A');
      const positionA = await findByTestId('QUEUE_PAGE_ROW_POSITION_Q-A');

      expect(titleA.textContent).toBe('Alpha Quest');
      expect(statusA.textContent).toBe('in_progress');
      expect(guildA.textContent).toBe('guild-one');
      expect(positionA.textContent).toBe('1/2');
    });

    it('VALID: {2 entries} => tail row renders title, status, guild slug, and position', async () => {
      const proxy = QueuePageWidgetProxy();
      const head = QuestQueueEntryStub({
        questId: 'q-a',
        questTitle: 'Alpha Quest',
        guildSlug: 'guild-one' as never,
        status: 'in_progress' as never,
      });
      const tail = QuestQueueEntryStub({
        questId: 'q-b',
        questTitle: 'Beta Quest',
        guildSlug: 'guild-two' as never,
        status: 'approved' as never,
      });
      proxy.setupEntries({ entries: [head, tail] });
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueuePageWidget />
          </MemoryRouter>
        ),
      });

      const titleB = await findByTestId('QUEUE_PAGE_ROW_TITLE_Q-B');
      const statusB = await findByTestId('QUEUE_PAGE_ROW_STATUS_Q-B');
      const guildB = await findByTestId('QUEUE_PAGE_ROW_GUILD_Q-B');
      const positionB = await findByTestId('QUEUE_PAGE_ROW_POSITION_Q-B');

      expect(titleB.textContent).toBe('Beta Quest');
      expect(statusB.textContent).toBe('approved');
      expect(guildB.textContent).toBe('guild-two');
      expect(positionB.textContent).toBe('2/2');
    });

    it('VALID: {2 entries} => each row links to /:guildSlug/quest/:questId', async () => {
      const proxy = QueuePageWidgetProxy();
      const head = QuestQueueEntryStub({
        questId: 'q-a',
        questTitle: 'Alpha Quest',
        guildSlug: 'guild-one' as never,
      });
      const tail = QuestQueueEntryStub({
        questId: 'q-b',
        questTitle: 'Beta Quest',
        guildSlug: 'guild-two' as never,
      });
      proxy.setupEntries({ entries: [head, tail] });
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueuePageWidget />
          </MemoryRouter>
        ),
      });

      const rowA = await findByTestId('QUEUE_PAGE_ROW_Q-A');
      const rowB = await findByTestId('QUEUE_PAGE_ROW_Q-B');

      expect(rowA.getAttribute('href')).toBe('/guild-one/quest/q-a');
      expect(rowB.getAttribute('href')).toBe('/guild-two/quest/q-b');
    });

    it('VALID: {entry has error} => row renders error badge with message title', async () => {
      const proxy = QueuePageWidgetProxy();
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
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueuePageWidget />
          </MemoryRouter>
        ),
      });

      const badge = await findByTestId('QUEUE_PAGE_ROW_ERROR_Q-ERR');

      expect(badge.getAttribute('title')).toBe('runner threw');
    });
  });

  describe('error entry banner', () => {
    it('VALID: {head has error} => renders queue runner error banner with message', async () => {
      const proxy = QueuePageWidgetProxy();
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
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueuePageWidget />
          </MemoryRouter>
        ),
      });

      const message = await findByTestId('QUEUE_PAGE_ERROR_MESSAGE');

      expect(message.textContent).toBe('runner threw');
    });

    it('VALID: {head has no error} => does NOT render error banner', async () => {
      const proxy = QueuePageWidgetProxy();
      proxy.setupEntries({
        entries: [QuestQueueEntryStub({ questId: 'q-ok', questTitle: 'Healthy' })],
      });
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId, queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueuePageWidget />
          </MemoryRouter>
        ),
      });

      await findByTestId('QUEUE_PAGE_ROW_Q-OK');

      expect(queryByTestId('QUEUE_PAGE_ERROR')).toBe(null);
    });
  });

  describe('dispatch toggle', () => {
    it('VALID: {mode: paused} => page hosts the dispatch toggle showing PLAY', async () => {
      const proxy = QueuePageWidgetProxy();
      proxy.setupEntries({ entries: [] });
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueuePageWidget />
          </MemoryRouter>
        ),
      });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PLAY' })).toBe(true);
    });

    it('VALID: {mode: node-playing} => page hosts the dispatch toggle showing PAUSE', async () => {
      const proxy = QueuePageWidgetProxy();
      proxy.setupEntries({ entries: [] });
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'node-playing' }) });

      const { findByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueuePageWidget />
          </MemoryRouter>
        ),
      });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PAUSE' })).toBe(true);
    });
  });
});
