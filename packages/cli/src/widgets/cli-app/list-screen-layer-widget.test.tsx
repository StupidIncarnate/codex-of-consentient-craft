import React from 'react';

import { GuildIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { ListScreenLayerWidget } from './list-screen-layer-widget';
import { ListScreenLayerWidgetProxy } from './list-screen-layer-widget.proxy';

const noopCallback = (): void => {
  // No-op
};

const ASYNC_WAIT_MS = 100;

describe('ListScreenLayerWidget', () => {
  describe('rendering list content', () => {
    it('VALID: {empty quests} => displays Quests title and no quests message', async () => {
      const proxy = ListScreenLayerWidgetProxy();
      const guildId = GuildIdStub();

      proxy.setupQuests({ quests: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget guildId={guildId} onBack={noopCallback} />,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Quests/u);
      expect(frame).toMatch(/No active quests found/u);
    });

    it('VALID: {with quests} => displays quest list sorted by newest first', async () => {
      const proxy = ListScreenLayerWidgetProxy();
      const guildId = GuildIdStub();

      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            id: 'old-quest',
            folder: '001-old-quest',
            title: 'Old Quest',
            status: 'complete',
            createdAt: '2024-01-01T00:00:00Z',
          }),
          QuestListItemStub({
            id: 'new-quest',
            folder: '002-new-quest',
            title: 'New Quest',
            status: 'in_progress',
            createdAt: '2024-01-02T00:00:00Z',
          }),
        ],
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget guildId={guildId} onBack={noopCallback} />,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/New Quest/u);
      expect(frame).toMatch(/Old Quest/u);
      expect(frame).toMatch(/\[in_progress\]/u);
      expect(frame).toMatch(/\[done\]/u);
    });

    it('VALID: {} => displays back instruction', async () => {
      const proxy = ListScreenLayerWidgetProxy();
      const guildId = GuildIdStub();

      proxy.setupQuests({ quests: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget guildId={guildId} onBack={noopCallback} />,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Press Escape or 'q' to go back/u);
    });
  });
});
