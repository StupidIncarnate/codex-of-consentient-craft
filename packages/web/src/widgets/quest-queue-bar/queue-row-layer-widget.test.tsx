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
  describe('row content', () => {
    it('VALID: {index: 0, total: 2, entry} => renders "1/2 — guild / title" and links to the quest', () => {
      QueueRowLayerWidgetProxy();
      const entry = QuestQueueEntryStub({
        questId: 'q-a',
        questTitle: 'Alpha',
        guildSlug: 'guild-one' as never,
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

      const row = screen.getByTestId('QUEST_QUEUE_BAR_ROW_Q-A');

      expect(row.textContent).toBe('1/2 — guild-one / Alpha');
      expect(row.getAttribute('href')).toBe('/guild-one/quest/q-a');
    });

    it('VALID: {index: 1, total: 2, entry} => renders "2/2 — guild / title"', () => {
      QueueRowLayerWidgetProxy();
      const entry = QuestQueueEntryStub({
        questId: 'q-b',
        questTitle: 'Beta',
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

      const row = screen.getByTestId('QUEST_QUEUE_BAR_ROW_Q-B');

      expect(row.textContent).toBe('2/2 — guild-two / Beta');
    });
  });

  describe('active styling', () => {
    it('VALID: {isActive: true} => paints loot-gold text, raised background, and a loot-gold left border', () => {
      QueueRowLayerWidgetProxy();
      const entry = QuestQueueEntryStub({ questId: 'q-a', questTitle: 'Alpha' });

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

      const row = screen.getByTestId('QUEST_QUEUE_BAR_ROW_Q-A');

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
      const entry = QuestQueueEntryStub({ questId: 'q-a', questTitle: 'Alpha' });

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

      const row = screen.getByTestId('QUEST_QUEUE_BAR_ROW_Q-A');

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

      const badge = screen.getByTestId('QUEST_QUEUE_BAR_ROW_ERROR_Q-ERR');

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

      expect(screen.queryByTestId('QUEST_QUEUE_BAR_ROW_ERROR_Q-OK')).toBe(null);
    });
  });
});
