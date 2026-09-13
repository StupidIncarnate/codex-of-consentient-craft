import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import {
  ArrayIndexStub,
  QuestQueueEntryStub,
  TotalCountStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QueueRowLayerWidget } from './queue-row-layer-widget';
import { QueueRowLayerWidgetProxy } from './queue-row-layer-widget.proxy';

describe('QueueRowLayerWidget', () => {
  describe('row fields', () => {
    it('VALID: {index: 0, total: 2, entry} => renders position, title, status, and guild slug in separate fields', () => {
      QueueRowLayerWidgetProxy();
      const entry = QuestQueueEntryStub({
        questId: 'q-a',
        questTitle: 'Alpha Quest',
        guildSlug: 'guild-one' as never,
        status: 'in_progress' as never,
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueueRowLayerWidget
              entry={entry}
              index={ArrayIndexStub({ value: 0 })}
              total={TotalCountStub({ value: 2 })}
              isActive={false}
            />
          </MemoryRouter>
        ),
      });

      expect(screen.getByTestId('QUEUE_PAGE_ROW_POSITION_Q-A').textContent).toBe('1/2');
      expect(screen.getByTestId('QUEUE_PAGE_ROW_TITLE_Q-A').textContent).toBe('Alpha Quest');
      expect(screen.getByTestId('QUEUE_PAGE_ROW_STATUS_Q-A').textContent).toBe('in_progress');
      expect(screen.getByTestId('QUEUE_PAGE_ROW_GUILD_Q-A').textContent).toBe('guild-one');
    });

    it('VALID: {index: 1, total: 2, entry} => links to /:guildSlug/quest/:questId', () => {
      QueueRowLayerWidgetProxy();
      const entry = QuestQueueEntryStub({
        questId: 'q-b',
        questTitle: 'Beta Quest',
        guildSlug: 'guild-two' as never,
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueueRowLayerWidget
              entry={entry}
              index={ArrayIndexStub({ value: 1 })}
              total={TotalCountStub({ value: 2 })}
              isActive={false}
            />
          </MemoryRouter>
        ),
      });

      const row = screen.getByTestId('QUEUE_PAGE_ROW_Q-B');

      expect(row.getAttribute('href')).toBe('/guild-two/quest/q-b');
      expect(screen.getByTestId('QUEUE_PAGE_ROW_POSITION_Q-B').textContent).toBe('2/2');
    });
  });

  describe('active styling', () => {
    it('VALID: {isActive: true} => paints loot-gold text, raised background, and a loot-gold left border', () => {
      QueueRowLayerWidgetProxy();
      const entry = QuestQueueEntryStub({ questId: 'q-a', questTitle: 'Alpha Quest' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueueRowLayerWidget
              entry={entry}
              index={ArrayIndexStub({ value: 0 })}
              total={TotalCountStub({ value: 1 })}
              isActive={true}
            />
          </MemoryRouter>
        ),
      });

      const row = screen.getByTestId('QUEUE_PAGE_ROW_Q-A');

      expect({
        color: row.style.color,
        backgroundColor: row.style.backgroundColor,
        borderLeft: row.style.borderLeft,
      }).toStrictEqual({
        color: 'rgb(251, 191, 36)',
        backgroundColor: 'rgb(42, 26, 20)',
        borderLeft: '1px solid rgb(251, 191, 36)',
      });
    });

    it('VALID: {isActive: false} => paints default text, transparent background, and a transparent left border', () => {
      QueueRowLayerWidgetProxy();
      const entry = QuestQueueEntryStub({ questId: 'q-a', questTitle: 'Alpha Quest' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueueRowLayerWidget
              entry={entry}
              index={ArrayIndexStub({ value: 0 })}
              total={TotalCountStub({ value: 1 })}
              isActive={false}
            />
          </MemoryRouter>
        ),
      });

      const row = screen.getByTestId('QUEUE_PAGE_ROW_Q-A');

      expect({
        color: row.style.color,
        backgroundColor: row.style.backgroundColor,
        borderLeft: row.style.borderLeft,
      }).toStrictEqual({
        color: 'rgb(224, 207, 192)',
        backgroundColor: 'transparent',
        borderLeft: '1px solid transparent',
      });
    });
  });

  describe('error badge', () => {
    it('VALID: {entry has error} => renders an error badge whose title is the error message', () => {
      QueueRowLayerWidgetProxy();
      const entry = QuestQueueEntryStub({
        questId: 'q-err',
        questTitle: 'Errored',
        error: { message: 'boom' as never, at: '2024-01-15T10:06:00.000Z' as never },
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueueRowLayerWidget
              entry={entry}
              index={ArrayIndexStub({ value: 0 })}
              total={TotalCountStub({ value: 1 })}
              isActive={false}
            />
          </MemoryRouter>
        ),
      });

      const badge = screen.getByTestId('QUEUE_PAGE_ROW_ERROR_Q-ERR');

      expect(badge.getAttribute('title')).toBe('boom');
    });

    it('VALID: {entry has no error} => renders no error badge', () => {
      QueueRowLayerWidgetProxy();
      const entry = QuestQueueEntryStub({ questId: 'q-ok', questTitle: 'Healthy' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QueueRowLayerWidget
              entry={entry}
              index={ArrayIndexStub({ value: 0 })}
              total={TotalCountStub({ value: 1 })}
              isActive={false}
            />
          </MemoryRouter>
        ),
      });

      expect(screen.queryByTestId('QUEUE_PAGE_ROW_ERROR_Q-OK')).toBe(null);
    });
  });
});
